<script lang="ts">
	import { storeApi } from '$lib/api/store';
	import { storeSettings } from '$lib/stores/store';
	import type { Store } from '$lib/types/common';
	import { getErrorMessage } from '$lib/utils/errors';
	import { slugifyFromName } from '$lib/utils/slug';

	interface Props {
		data: {
			store: Store | null;
		};
	}

	let { data }: Props = $props();

	let name = $state(data.store?.name || '');
	let storeExists = $state(!!data.store);
	let slug = $state(data.store?.slug || '');
	// Бэкенд требует slug у магазина и, в отличие от товаров и категорий, сам его не придумывает
	const autoSlug = $derived(slugifyFromName(name));
	let logoUrl = $state(data.store?.logoUrl || '');
	let faviconUrl = $state(data.store?.faviconUrl || '');
	let contactEmail = $state(data.store?.contactEmail || '');
	let contactPhone = $state(data.store?.contactPhone || '');
	let legalName = $state(data.store?.legalName || '');
	let inn = $state(data.store?.inn || '');
	let legalAddress = $state(data.store?.legalAddress || '');
	let currency = $state(data.store?.currency || 'RUB');
	let timezone = $state(data.store?.timezone || 'Europe/Moscow');
	let locale = $state(data.store?.locale || 'ru-RU');
	let isActive = $state(data.store?.isActive ?? true);

	// Получение заказа и ссылки подвала (store.settings). Пустое поле суммы — «нет порога»
	const settings = data.store?.settings;
	let deliveryEnabled = $state(settings?.delivery.enabled ?? true);
	let deliveryPrice = $state(settings?.delivery.price ?? '0');
	let freeFrom = $state(settings?.delivery.freeFrom ?? '');
	let minOrderAmount = $state(settings?.delivery.minOrderAmount ?? '');
	let pickupEnabled = $state(settings?.pickup.enabled ?? true);
	let pageAbout = $state(settings?.pages.about ?? '');
	let pagePrivacy = $state(settings?.pages.privacy ?? '');
	let pageTerms = $state(settings?.pages.terms ?? '');

	/** '' → null; иначе сумма с точностью до копеек, отрицательные и мусор — ошибка */
	function parseAmount(value: string | number, label: string, required = false): number | null {
		const text = String(value ?? '').trim().replace(',', '.');
		if (!text) {
			if (required) throw new Error(`${label}: укажите сумму`);
			return null;
		}
		if (!/^\d+(\.\d{1,2})?$/.test(text)) throw new Error(`${label}: число от нуля, не больше двух знаков после запятой`);
		return Number(text);
	}

	let isSubmitting = $state(false);
	let error = $state<string | null>(null);
	let success = $state(false);

	async function handleSubmit() {
		error = null;
		success = false;

		if (!name.trim()) {
			error = 'Название магазина обязательно';
			return;
		}

		if (!slug.trim() && !autoSlug) {
			error = 'Из названия не получился slug: укажите его вручную латиницей';
			return;
		}

		let delivery: { enabled: boolean; price: number | null; freeFrom: number | null; minOrderAmount: number | null };
		try {
			delivery = {
				enabled: deliveryEnabled,
				price: parseAmount(deliveryPrice, 'Стоимость доставки', true),
				freeFrom: parseAmount(freeFrom, 'Бесплатно от'),
				minOrderAmount: parseAmount(minOrderAmount, 'Минимальная сумма')
			};
		} catch (err) {
			error = (err as Error).message;
			return;
		}
		if (!deliveryEnabled && !pickupEnabled) {
			error = 'Включите хотя бы один способ получения, иначе покупатели не смогут оформить заказ';
			return;
		}

		isSubmitting = true;

		try {
			const storeData: Partial<Store> = {
				name: name.trim(),
				slug: slug.trim() || autoSlug,
				logoUrl: logoUrl.trim() || undefined,
				faviconUrl: faviconUrl.trim() || undefined,
				contactEmail: contactEmail.trim() || undefined,
				contactPhone: contactPhone.trim() || undefined,
				legalName: legalName.trim() || undefined,
				inn: inn.trim() || undefined,
				legalAddress: legalAddress.trim() || undefined,
				currency: currency.trim(),
				timezone: timezone.trim(),
				locale: locale.trim(),
				isActive,
				// Бэкенд принимает суммы числами, а отдаёт строками; поля сливаются с текущими
				settings: {
					delivery,
					pickup: { enabled: pickupEnabled },
					pages: {
						about: pageAbout.trim() || null,
						privacy: pagePrivacy.trim() || null,
						terms: pageTerms.trim() || null
					}
				} as unknown as Store['settings']
			};

			if (storeExists) {
				await storeApi.updateStore(storeData);
			} else {
				await storeApi.createStore(storeData);
				// Следующее сохранение — уже правка, а не повторное создание
				storeExists = true;
			}

			// Обновляем store в глобальном store
			const updatedStore = await storeApi.getStore();
			$storeSettings = updatedStore;
			slug = updatedStore.slug;

			success = true;
			setTimeout(() => {
				success = false;
			}, 3000);
		} catch (err) {
			const message = getErrorMessage(err, 'Ошибка сохранения настроек');
			if (Array.isArray(message)) {
				error = message.join(', ');
			} else {
				error = message;
			}
		} finally {
			isSubmitting = false;
		}
	}
</script>

<svelte:head>
	<title>Настройки магазина - Админ-панель</title>
</svelte:head>

<div class="bg-white rounded-lg shadow-md p-6">
	<h1 class="text-headline text-ink mb-6">Настройки магазина</h1>

	<form onsubmit={(e) => { e.preventDefault(); handleSubmit(); }} class="space-y-6">
		{#if error}
			<div role="alert" class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
				{error}
			</div>
		{/if}

		{#if success}
			<div role="status" class="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
				Настройки успешно сохранены!
			</div>
		{/if}

		<!-- Основная информация -->
		<div>
			<h2 class="text-title text-ink mb-4">Основная информация</h2>
			<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
				<div>
					<label for="store-name" class="block text-sm font-medium text-gray-700 mb-1">
						Название магазина <span class="text-red-500" aria-hidden="true">*</span>
					</label>
					<input
						id="store-name"
						type="text"
						bind:value={name}
						required
						class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
					/>
				</div>

				<div>
					<label for="store-slug" class="block text-sm font-medium text-gray-700 mb-1">Slug</label>
					<!-- Подсказка показывает, какой slug получится, если поле оставить пустым -->
					<input
						id="store-slug"
						type="text"
						bind:value={slug}
						placeholder={autoSlug || 'Автоматически из названия'}
						aria-describedby="store-slug-hint"
						class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
					/>
					<p id="store-slug-hint" class="mt-1 text-xs text-gray-500">
						Латиница, цифры и дефисы. Пустое поле заполнится из названия.
					</p>
				</div>
			</div>
		</div>

		<!-- Контакты -->
		<div>
			<h2 class="text-title text-ink mb-4">Контакты</h2>
			<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
				<div>
					<label class="block text-sm font-medium text-gray-700 mb-1">Email</label>
					<input
						type="email"
						bind:value={contactEmail}
						class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
					/>
				</div>

				<div>
					<label class="block text-sm font-medium text-gray-700 mb-1">Телефон</label>
					<input
						type="tel"
						bind:value={contactPhone}
						class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
					/>
				</div>
			</div>
		</div>

		<!-- Юридическая информация -->
		<div>
			<h2 class="text-title text-ink mb-4">Юридическая информация</h2>
			<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
				<div>
					<label class="block text-sm font-medium text-gray-700 mb-1">Юридическое название</label>
					<input
						type="text"
						bind:value={legalName}
						class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
					/>
				</div>

				<div>
					<label class="block text-sm font-medium text-gray-700 mb-1">ИНН</label>
					<input
						type="text"
						bind:value={inn}
						class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
					/>
				</div>
			</div>
			<div class="mt-4">
				<label class="block text-sm font-medium text-gray-700 mb-1">Юридический адрес</label>
				<textarea
					bind:value={legalAddress}
					rows="2"
					class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
				></textarea>
			</div>
		</div>

		<!-- Настройки -->
		<div>
			<h2 class="text-title text-ink mb-4">Настройки</h2>
			<div class="grid grid-cols-1 md:grid-cols-3 gap-4">
				<div>
					<label class="block text-sm font-medium text-gray-700 mb-1">Валюта</label>
					<input
						type="text"
						bind:value={currency}
						placeholder="RUB"
						class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
					/>
				</div>

				<div>
					<label class="block text-sm font-medium text-gray-700 mb-1">Часовой пояс</label>
					<input
						type="text"
						bind:value={timezone}
						placeholder="Europe/Moscow"
						class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
					/>
				</div>

				<div>
					<label class="block text-sm font-medium text-gray-700 mb-1">Локаль</label>
					<input
						type="text"
						bind:value={locale}
						placeholder="ru-RU"
						class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
					/>
				</div>
			</div>
		</div>

		<!-- Получение заказа -->
		<fieldset class="m-0 min-w-0 border-0 p-0">
			<legend class="text-title text-ink mb-4">Получение заказа</legend>
			<div class="space-y-4">
				<label class="flex items-center space-x-2">
					<input
						type="checkbox"
						bind:checked={deliveryEnabled}
						class="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
					/>
					<span class="text-sm text-gray-700">Доставка курьером</span>
				</label>
				<div class="grid grid-cols-1 gap-4 md:grid-cols-3">
					<div>
						<label for="delivery-price" class="block text-sm font-medium text-gray-700 mb-1">Стоимость доставки, ₽</label>
						<input
							id="delivery-price"
							type="text"
							inputmode="decimal"
							bind:value={deliveryPrice}
							disabled={!deliveryEnabled}
							class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
						/>
					</div>
					<div>
						<label for="delivery-free-from" class="block text-sm font-medium text-gray-700 mb-1">Бесплатно от, ₽</label>
						<input
							id="delivery-free-from"
							type="text"
							inputmode="decimal"
							bind:value={freeFrom}
							disabled={!deliveryEnabled}
							placeholder="Без порога"
							aria-describedby="delivery-free-from-hint"
							class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
						/>
						<p id="delivery-free-from-hint" class="mt-1 text-xs text-gray-500">Сумма товаров после скидки</p>
					</div>
					<div>
						<label for="delivery-min-order" class="block text-sm font-medium text-gray-700 mb-1">Заказ с доставкой от, ₽</label>
						<input
							id="delivery-min-order"
							type="text"
							inputmode="decimal"
							bind:value={minOrderAmount}
							disabled={!deliveryEnabled}
							placeholder="Без минимума"
							class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
						/>
					</div>
				</div>
				<label class="flex items-center space-x-2">
					<input
						type="checkbox"
						bind:checked={pickupEnabled}
						class="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
					/>
					<span class="text-sm text-gray-700">Самовывоз из пунктов выдачи и магазинов</span>
				</label>
			</div>
		</fieldset>

		<!-- Ссылки подвала -->
		<fieldset class="m-0 min-w-0 border-0 p-0">
			<legend class="text-title text-ink mb-1">Ссылки в подвале</legend>
			<p class="mb-4 text-sm text-gray-500">Адрес страницы или путь на сайте. Пустое поле убирает ссылку.</p>
			<div class="grid grid-cols-1 gap-4 md:grid-cols-3">
				<div>
					<label for="page-about" class="block text-sm font-medium text-gray-700 mb-1">О магазине</label>
					<input id="page-about" type="text" bind:value={pageAbout} placeholder="/about" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
				</div>
				<div>
					<label for="page-privacy" class="block text-sm font-medium text-gray-700 mb-1">Политика конфиденциальности</label>
					<input id="page-privacy" type="text" bind:value={pagePrivacy} placeholder="https://…" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
				</div>
				<div>
					<label for="page-terms" class="block text-sm font-medium text-gray-700 mb-1">Условия продажи</label>
					<input id="page-terms" type="text" bind:value={pageTerms} placeholder="https://…" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
				</div>
			</div>
		</fieldset>

		<!-- URL изображений -->
		<div>
			<h2 class="text-title text-ink mb-4">Изображения</h2>
			<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
				<div>
					<label class="block text-sm font-medium text-gray-700 mb-1">URL логотипа</label>
					<input
						type="url"
						bind:value={logoUrl}
						placeholder="https://example.com/logo.png"
						class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
					/>
				</div>

				<div>
					<label class="block text-sm font-medium text-gray-700 mb-1">URL favicon</label>
					<input
						type="url"
						bind:value={faviconUrl}
						placeholder="https://example.com/favicon.ico"
						class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
					/>
				</div>
			</div>
		</div>

		<div>
			<label class="flex items-center space-x-2">
				<input
					type="checkbox"
					bind:checked={isActive}
					class="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
				/>
				<span class="text-sm text-gray-700">Магазин активен</span>
			</label>
		</div>

		<div class="flex space-x-2 pt-4">
			<button
				type="submit"
				disabled={isSubmitting}
				class="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
			>
				{isSubmitting ? 'Сохранение...' : 'Сохранить настройки'}
			</button>
		</div>
	</form>
</div>
