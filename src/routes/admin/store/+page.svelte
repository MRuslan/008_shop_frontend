<script lang="ts">
	import { storeApi } from '$lib/api/store';
	import { storeSettings } from '$lib/stores/store';
	import type { Store } from '$lib/types/common';

	interface Props {
		data: {
			store: Store | null;
		};
	}

	let { data }: Props = $props();

	let name = $state(data.store?.name || '');
	let slug = $state(data.store?.slug || '');
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

		isSubmitting = true;

		try {
			const storeData: Partial<Store> = {
				name: name.trim(),
				slug: slug.trim() || undefined,
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
				isActive
			};

			if (data.store) {
				await storeApi.updateStore(storeData);
			} else {
				await storeApi.createStore(storeData);
			}

			// Обновляем store в глобальном store
			const updatedStore = await storeApi.getStore();
			$storeSettings = updatedStore;

			success = true;
			setTimeout(() => {
				success = false;
			}, 3000);
		} catch (err: any) {
			const message = err.message || 'Ошибка сохранения настроек';
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
	<h1 class="text-2xl font-bold text-gray-800 mb-6">Настройки магазина</h1>

	<form onsubmit={(e) => { e.preventDefault(); handleSubmit(); }} class="space-y-6">
		{#if error}
			<div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
				{error}
			</div>
		{/if}

		{#if success}
			<div class="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
				Настройки успешно сохранены!
			</div>
		{/if}

		<!-- Основная информация -->
		<div>
			<h2 class="text-lg font-semibold text-gray-800 mb-4">Основная информация</h2>
			<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
				<div>
					<label class="block text-sm font-medium text-gray-700 mb-1">
						Название магазина <span class="text-red-500">*</span>
					</label>
					<input
						type="text"
						bind:value={name}
						required
						class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
					/>
				</div>

				<div>
					<label class="block text-sm font-medium text-gray-700 mb-1">Slug</label>
					<input
						type="text"
						bind:value={slug}
						placeholder="Автоматически из названия"
						class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
					/>
				</div>
			</div>
		</div>

		<!-- Контакты -->
		<div>
			<h2 class="text-lg font-semibold text-gray-800 mb-4">Контакты</h2>
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
			<h2 class="text-lg font-semibold text-gray-800 mb-4">Юридическая информация</h2>
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
			<h2 class="text-lg font-semibold text-gray-800 mb-4">Настройки</h2>
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

		<!-- URL изображений -->
		<div>
			<h2 class="text-lg font-semibold text-gray-800 mb-4">Изображения</h2>
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
