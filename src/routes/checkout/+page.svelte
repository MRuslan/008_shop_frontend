<script lang="ts">
	import { goto } from '$app/navigation';
	import { tick, untrack } from 'svelte';
	import { cartStore, cartTotal } from '$lib/stores/cart';
	import { cartApi } from '$lib/api/cart';
	import { ordersApi } from '$lib/api/orders';
	import { addressesApi } from '$lib/api/addresses';
	import { locationsApi } from '$lib/api/locations';
	import type { Address, CreateAddressDto, UpdateAddressDto } from '$lib/types/common';
	import type { Location, DeliveryType, CreateOrderDto, OrderQuote } from '$lib/types/order';
	import type { CartAvailability } from '$lib/types/cart';
	import { formatPrice } from '$lib/utils/format';
	import { shortageText, couponToPromo } from '$lib/utils/availability';
	import { deliveryTerms as describeDelivery } from '$lib/utils/delivery';
	import { storeSettings } from '$lib/stores/store';
	import { toast } from '$lib/stores/toast';
	import { getErrorMessage, humanizeMessage, isApiError } from '$lib/utils/errors';
	import AddressList from '$lib/components/checkout/AddressList.svelte';
	import AddressForm from '$lib/components/checkout/AddressForm.svelte';
	import PickupLocationSelect from '$lib/components/checkout/PickupLocationSelect.svelte';
	import CouponInput from '$lib/components/checkout/CouponInput.svelte';
	import Skeleton from '$lib/components/ui/Skeleton.svelte';

	let { data } = $props();

	// Данные формы приходят с сервера вместе со страницей; isLoading — только повторная загрузка.
	// Дальше страница обновляет их сама (loadData), поэтому берём начальное значение
	const initial = untrack(() => data);
	let isLoading = $state(false);
	let isSubmitting = $state(false);
	// Ошибка загрузки блокирует страницу, ошибка отправки показывается рядом с кнопкой и не прячет форму
	let loadError = $state<string | null>(initial.loadError);
	let submitError = $state<string | null>(null);

	// Состояние формы
	let deliveryType = $state<DeliveryType>('delivery');
	let selectedAddressId = $state<number | null>(null);
	let selectedLocationId = $state<number | null>(null);
	let couponCode = $state<string | null>(null);
	let comment = $state('');

	// Данные
	let addresses = $state<Address[]>([]);
	let locations = $state<Location[]>([]);
	let showAddressForm = $state(false);
	let editingAddress = $state<Address | null>(null);
	// Наличие корзины по точкам; null — бэкенд его не отдаёт, тогда проверка только при оформлении
	let availability = $state<CartAvailability | null>(null);

	// Предрасчёт с сервера: промокод, доставка, итог. null — ещё не посчитан или бэкенд его не умеет
	let quote = $state<OrderQuote | null>(null);
	let quotePending = $state(false);
	let quoteError = $state<string | null>(null);
	let quoteSupported = $state(true);
	let quoteSeq = 0;

	let blockersBox: HTMLElement | undefined = $state();

	const currency = $derived($storeSettings?.currency || 'RUB');
	const money = (value: string | number) =>
		formatPrice(typeof value === 'number' ? value.toFixed(2) : value, currency);

	// Способы получения: свежие флаги из наличия, иначе из настроек магазина; без настроек доступны оба
	const deliverySettings = $derived($storeSettings?.settings?.delivery ?? null);
	const deliveryEnabled = $derived(availability?.delivery.enabled ?? deliverySettings?.enabled ?? true);
	const pickupEnabled = $derived(
		availability?.pickup.enabled ?? $storeSettings?.settings?.pickup?.enabled ?? true
	);

	const pickupStock = $derived(
		availability
			? new Map(
					availability.pickup.points.map((point) => [
						point.locationId,
						{ available: point.available, shortages: point.shortages }
					])
				)
			: null
	);

	// Условия доставки одной строкой под вариантом «Доставка курьером»
	const deliveryTerms = $derived(describeDelivery(deliverySettings, currency));

	async function loadAvailability() {
		try {
			availability = await cartApi.getAvailability();
		} catch (err) {
			// Старый бэкенд без наличия по точкам: остатки проверит оформление заказа
			console.error('Failed to load cart availability:', err);
			availability = null;
		}
	}

	function pickDefaultLocation() {
		const usable = locations.filter((location) => !pickupStock || pickupStock.get(location.id)?.available);
		if (selectedLocationId === null || !usable.some((location) => location.id === selectedLocationId)) {
			selectedLocationId = usable[0]?.id ?? null;
		}
	}

	function applyLoaded(loaded: { addresses: Address[]; locations: Location[] }) {
		addresses = loaded.addresses;

		// Адрес по умолчанию, если пользователь ещё ничего не выбрал
		if (selectedAddressId === null || !loaded.addresses.some((a) => a.id === selectedAddressId)) {
			const defaultAddress = loaded.addresses.find((a) => a.isDefault) ?? loaded.addresses[0];
			selectedAddressId = defaultAddress?.id ?? null;
		}

		// Склад не выдаёт заказы: бэкенд принимает самовывоз только из пунктов выдачи и магазинов
		locations = loaded.locations.filter((location) => location.type !== 'warehouse');
		pickDefaultLocation();

		// Выключенный магазином способ не предлагаем по умолчанию
		if (deliveryType === 'delivery' && !deliveryEnabled && pickupEnabled) deliveryType = 'pickup';
		if (deliveryType === 'pickup' && !pickupEnabled && deliveryEnabled) deliveryType = 'delivery';
	}

	if (initial.checkout) {
		availability = initial.checkout.availability;
		applyLoaded(initial.checkout);
	}

	// Повторная загрузка: после ошибки и после правки адресов. Корзину тоже перечитываем
	async function loadData() {
		isLoading = true;
		loadError = null;

		try {
			const [cart, userAddresses, allLocations] = await Promise.all([
				cartApi.getCart(),
				addressesApi.getAddresses(),
				locationsApi.getLocations({ isActive: true }),
				loadAvailability()
			]);
			cartStore.setCart(cart);
			applyLoaded({ addresses: userAddresses, locations: allLocations });
		} catch (err) {
			loadError = getErrorMessage(err, 'Не удалось загрузить адреса и точки самовывоза.');
		} finally {
			isLoading = false;
		}
	}

	// Пересчёт при каждом изменении того, что влияет на сумму. Короткая задержка склеивает быстрые клики,
	// номер запроса отбрасывает ответы, которые пришли позже более нового
	const quoteKey = $derived(
		JSON.stringify([
			deliveryType,
			deliveryType === 'delivery' ? selectedAddressId : selectedLocationId,
			couponCode,
			$cartStore?.items.map((item) => [item.productId, item.quantity]) ?? []
		])
	);

	$effect(() => {
		void quoteKey;
		if (isLoading || loadError || !quoteSupported || !$cartStore?.items.length) return;
		const timer = setTimeout(refreshQuote, 150);
		return () => clearTimeout(timer);
	});

	async function refreshQuote() {
		const seq = ++quoteSeq;
		quotePending = true;
		try {
			const result = await ordersApi.quote({
				deliveryType,
				deliveryAddressId: deliveryType === 'delivery' ? (selectedAddressId ?? undefined) : undefined,
				pickupLocationId: deliveryType === 'pickup' ? (selectedLocationId ?? undefined) : undefined,
				couponCode: couponCode ?? undefined
			});
			if (seq !== quoteSeq) return;
			quote = result;
			quoteError = null;
		} catch (err) {
			if (seq !== quoteSeq) return;
			if (isApiError(err) && err.statusCode === 404) {
				// Бэкенд без предрасчёта: считаем по корзине, промокод проверит оформление
				quoteSupported = false;
				quote = null;
			} else {
				quoteError = getErrorMessage(err, 'Не удалось пересчитать заказ. Итог уточним при оформлении.');
			}
		} finally {
			if (seq === quoteSeq) quotePending = false;
		}
	}

	// Суммы: с сервера, пока его нет — по корзине без скидки и доставки
	const subtotal = $derived(quote?.subtotalAmount ?? $cartTotal);
	const discount = $derived(quote ? parseFloat(quote.discountAmount) : 0);
	const deliveryCost = $derived(quote && quote.deliveryType === 'delivery' ? parseFloat(quote.deliveryCost) : null);
	const total = $derived(quote?.totalAmount ?? $cartTotal);

	const couponStatus = $derived.by((): 'checking' | 'applied' | 'rejected' | 'unchecked' => {
		if (!couponCode || !quoteSupported) return 'unchecked';
		const answer = quote?.coupon;
		if (quotePending || !answer || answer.code.toUpperCase() !== couponCode) {
			return quotePending ? 'checking' : 'unchecked';
		}
		return answer.applied ? 'applied' : 'rejected';
	});

	// Что мешает оформить заказ прямо сейчас: показываем рядом с кнопкой, а не после нажатия
	const blockers = $derived.by(() => {
		const list: string[] = [];
		if (deliveryType === 'delivery') {
			if (!deliveryEnabled) {
				list.push(
					pickupEnabled
						? 'Магазин сейчас не доставляет заказы. Выберите самовывоз.'
						: 'Магазин сейчас не принимает заказы.'
				);
			} else if (availability && !availability.delivery.available) {
				// Самовывоз предлагаем, только если хоть одна точка соберёт весь заказ
				const pickupHelps = pickupEnabled && availability.pickup.points.some((point) => point.available);
				const orPickup = pickupHelps ? ' или выберите самовывоз' : '';
				const shortages = availability.delivery.shortages;
				if (availability.delivery.locationId === null || shortages.length === 0) {
					list.push(`Доставка сейчас недоступна${pickupHelps ? ', выберите самовывоз' : ''}.`);
				} else {
					const noneLeft = shortages.every((s) => s.reason === 'unavailable' || s.available <= 0);
					list.push(
						`Для доставки не хватает товара: ${shortages.map((s) => shortageText(s, 'delivery')).join('; ')}. ` +
							`${noneLeft ? 'Уберите эти товары из корзины' : 'Уменьшите количество в корзине'}${orPickup}.`
					);
				}
			}
		} else if (!pickupEnabled) {
			list.push(
				deliveryEnabled
					? 'Самовывоз сейчас недоступен. Выберите доставку курьером.'
					: 'Магазин сейчас не принимает заказы.'
			);
		}

		for (const problem of quote?.problems ?? []) {
			if (problem.code === 'delivery_disabled' || problem.code === 'pickup_disabled') continue;
			if (problem.code === 'min_order_amount' && deliverySettings?.minOrderAmount) {
				const missing = parseFloat(deliverySettings.minOrderAmount) - (parseFloat(subtotal) - discount);
				list.push(
					`Доставка — для заказов от\u00a0${money(deliverySettings.minOrderAmount)}. ` +
						`Добавьте товаров на\u00a0${money(Math.max(missing, 0))}${pickupEnabled ? ' или выберите самовывоз' : ''}.`
				);
			} else if (problem.code === 'product_unavailable') {
				list.push(`${problem.message.replace(/"([^"]+)"/, '«$1»')}. Уберите его из корзины.`);
			} else {
				list.push(problem.message);
			}
		}

		if (couponStatus === 'rejected') {
			list.push(`Промокод ${couponCode} не подходит. Уберите его, чтобы оформить заказ.`);
		}
		return list;
	});

	async function handleSaveAddress(data: CreateAddressDto | UpdateAddressDto) {
		try {
			if (editingAddress) {
				await addressesApi.updateAddress(editingAddress.id, data);
			} else {
				const created = await addressesApi.createAddress(data as CreateAddressDto);
				selectedAddressId = created.id;
			}

			await loadData();
			showAddressForm = false;
			editingAddress = null;
		} catch (err) {
			throw new Error(getErrorMessage(err, 'Не удалось сохранить адрес'));
		}
	}

	async function handleDeleteAddress(addressId: number) {
		try {
			await addressesApi.deleteAddress(addressId);
			if (selectedAddressId === addressId) selectedAddressId = null;
			await loadData();
			toast.success('Адрес удалён');
		} catch (err) {
			toast.error(getErrorMessage(err, 'Не удалось удалить адрес'));
		}
	}

	async function handleSubmitOrder() {
		submitError = null;

		if (blockers.length > 0) {
			// Причины уже написаны над кнопкой: переводим туда фокус, чтобы их прочитал и скринридер
			await tick();
			blockersBox?.focus();
			return;
		}

		if (deliveryType === 'delivery' && !selectedAddressId) {
			submitError = addresses.length ? 'Выберите адрес доставки.' : 'Добавьте адрес доставки.';
			return;
		}

		if (deliveryType === 'pickup' && !selectedLocationId) {
			submitError = locations.length
				? 'Выберите точку самовывоза.'
				: 'Самовывоз сейчас недоступен. Выберите доставку курьером.';
			return;
		}

		isSubmitting = true;

		try {
			const orderData: CreateOrderDto = {
				deliveryType,
				deliveryAddressId: deliveryType === 'delivery' ? (selectedAddressId ?? undefined) : undefined,
				pickupLocationId: deliveryType === 'pickup' ? (selectedLocationId ?? undefined) : undefined,
				couponCode: couponCode || undefined,
				comment: comment.trim() || undefined
			};

			const order = await ordersApi.createOrder(orderData);

			// Бэкенд уже очистил корзину; перечитываем её, а не обнуляем: null страница корзины сочла бы ошибкой
			void cartStore.reload();
			toast.success(`Заказ №${order.id} оформлен`);
			await goto(`/account/orders/${order.id}`);
		} catch (err) {
			submitError = couponToPromo(getErrorMessage(err, 'Не удалось оформить заказ. Попробуйте ещё раз.'));
			// Остатки могли измениться, пока покупатель оформлял: обновляем наличие и итог
			await loadAvailability();
			pickDefaultLocation();
			void refreshQuote();
		} finally {
			isSubmitting = false;
		}
	}
</script>

<svelte:head>
	<title>Оформление заказа</title>
	<meta name="robots" content="noindex" />
</svelte:head>

<div class="container py-4 md:py-6">
	<h1 class="mb-4 text-headline text-balance text-ink md:mb-6 md:text-headline-lg">Оформление заказа</h1>

	{#if isLoading}
		<!-- Заглушка повторяет форму: способ получения, адрес, промокод, комментарий и итог справа -->
		<div class="grid grid-cols-1 gap-3 lg:grid-cols-3 lg:gap-6" role="status">
			<span class="sr-only">Загружаем адреса и точки самовывоза…</span>
			<div class="space-y-3 lg:col-span-2 lg:space-y-6">
				<div class="rounded-2xl bg-surface p-5 md:p-6">
					<Skeleton class="mb-4 h-7 w-48" />
					<div class="space-y-3">
						<Skeleton class="h-[4.5rem]" />
						<Skeleton class="h-[4.5rem]" />
					</div>
				</div>
				<div class="rounded-2xl bg-surface p-5 md:p-6">
					<Skeleton class="mb-4 h-7 w-40" />
					<Skeleton class="h-24" />
				</div>
				<div class="rounded-2xl bg-surface p-5 md:p-6">
					<Skeleton class="mb-2 h-5 w-24" />
					<Skeleton class="h-11" />
				</div>
			</div>
			<div class="lg:col-span-1">
				<div class="space-y-3 rounded-2xl bg-surface p-5 md:p-6">
					<Skeleton class="mb-4 h-7 w-32" />
					<Skeleton class="h-5" />
					<Skeleton class="h-5 w-3/4" />
					<Skeleton class="mt-4 h-8" />
					<Skeleton class="mt-4 h-12" />
				</div>
			</div>
		</div>
	{:else if loadError}
		<div role="alert" class="mb-4 notice-error">
			{loadError}
		</div>
		<button
			type="button"
			onclick={loadData}
			class="btn-primary"
		>
			Попробовать снова
		</button>
	{:else if !$cartStore || $cartStore.items.length === 0}
		<div class="text-center py-12">
			<p class="text-title-sm text-ink">В корзине пока ничего нет</p>
			<p class="mt-1 mb-5 text-body-sm text-gray-600">Чтобы оформить заказ, добавьте товары из каталога.</p>
			<a href="/catalog" class="btn-primary">Перейти в каталог</a>
		</div>
	{:else}
		<div class="grid grid-cols-1 gap-3 lg:grid-cols-3 lg:items-start lg:gap-6">
			<!-- Основная форма -->
			<div class="space-y-3 lg:col-span-2 lg:space-y-6">
				<!-- Тип доставки -->
				<fieldset class="m-0 min-w-0 border-0 rounded-2xl bg-surface p-5 md:p-6">
					<legend class="sr-only">Способ получения</legend>
					<h2 class="text-title text-ink mb-4" aria-hidden="true">Способ получения</h2>
					<div class="space-y-3">
						<label
							class="flex items-center gap-3 rounded-xl border-2 p-4 transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ink has-[:focus-visible]:ring-offset-2 {deliveryType === 'delivery'
								? 'border-ink'
								: deliveryEnabled
									? 'cursor-pointer border-line hover:border-gray-300'
									: 'cursor-not-allowed border-line bg-gray-50'}"
						>
							<input
								type="radio"
								bind:group={deliveryType}
								value="delivery"
								disabled={!deliveryEnabled}
								class="size-4"
							/>
							<span class="flex-1">
								<span class="block text-title-sm {deliveryEnabled ? 'text-ink' : 'text-gray-600'}">Доставка курьером</span>
								{#if !deliveryEnabled}
									<span class="block text-body-sm text-gray-600">Сейчас магазин не доставляет заказы</span>
								{:else}
									<span class="block text-body-sm text-gray-600">Привезём по адресу, который вы укажете</span>
									{#if deliveryTerms}
										<span class="block text-body-sm text-gray-600">{deliveryTerms}</span>
									{/if}
								{/if}
							</span>
						</label>
						<label
							class="flex items-center gap-3 rounded-xl border-2 p-4 transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ink has-[:focus-visible]:ring-offset-2 {deliveryType === 'pickup'
								? 'border-ink'
								: pickupEnabled
									? 'cursor-pointer border-line hover:border-gray-300'
									: 'cursor-not-allowed border-line bg-gray-50'}"
						>
							<input
								type="radio"
								bind:group={deliveryType}
								value="pickup"
								disabled={!pickupEnabled}
								class="size-4"
							/>
							<span class="flex-1">
								<span class="block text-title-sm {pickupEnabled ? 'text-ink' : 'text-gray-600'}">Самовывоз</span>
								<span class="block text-body-sm text-gray-600">
									{pickupEnabled
										? 'Бесплатно. Заберёте сами из пункта выдачи или магазина'
										: 'Сейчас самовывоз недоступен'}
								</span>
							</span>
						</label>
					</div>
				</fieldset>

				<!-- Адреса доставки или точки самовывоза -->
				{#if deliveryType === 'delivery'}
					<div class="rounded-2xl bg-surface p-5 md:p-6">
						<h2 class="text-title text-ink mb-4">Адрес доставки</h2>

						{#if showAddressForm}
							<AddressForm
								address={editingAddress}
								onSave={handleSaveAddress}
								onCancel={() => {
									showAddressForm = false;
									editingAddress = null;
								}}
							/>
						{:else}
							<AddressList
								{addresses}
								{selectedAddressId}
								onSelect={(id) => (selectedAddressId = id)}
								onEdit={(address) => {
									editingAddress = address;
									showAddressForm = true;
								}}
								onDelete={handleDeleteAddress}
								onAddNew={() => {
									editingAddress = null;
									showAddressForm = true;
								}}
							/>
						{/if}
					</div>
				{:else}
					<div class="rounded-2xl bg-surface p-5 md:p-6">
						<h2 class="text-title text-ink mb-4">Точка самовывоза</h2>
						<PickupLocationSelect
							{locations}
							{selectedLocationId}
							stock={pickupStock}
							onSelect={(id) => (selectedLocationId = id)}
						/>
					</div>
				{/if}

				<!-- Промокод -->
				<div class="rounded-2xl bg-surface p-5 md:p-6">
					<CouponInput
						{couponCode}
						status={couponStatus}
						discountLabel={discount > 0 ? `−${money(quote?.discountAmount ?? '0')}` : null}
						rejection={quote?.coupon?.error ? (humanizeMessage(quote.coupon.error) ?? couponToPromo(quote.coupon.error)) : null}
						onApply={(code) => (couponCode = code)}
						onRemove={() => (couponCode = null)}
					/>
				</div>

				<!-- Комментарий -->
				<div class="rounded-2xl bg-surface p-5 md:p-6">
					<label for="order-comment" class="mb-4 block text-title text-ink">
						Комментарий к заказу <span class="text-body-sm font-normal text-gray-500">(необязательно)</span>
					</label>
					<textarea
						id="order-comment"
						bind:value={comment}
						maxlength="2000"
						placeholder="Например, код домофона или удобное время для звонка"
						rows="4"
						class="w-full field"
					></textarea>
				</div>
			</div>

			<!-- Итого -->
			<div class="lg:col-span-1">
				<div class="sticky top-4 rounded-2xl bg-surface p-5 md:p-6">
					<h2 class="text-title text-ink mb-4">Ваш заказ</h2>

					<ul class="space-y-2 mb-4">
						{#each $cartStore.items as item (item.id)}
							<li class="flex justify-between gap-3 text-body-sm">
								<span class="text-gray-600 min-w-0 break-words">
									{item.product.name} × {item.quantity}
								</span>
								<span class="shrink-0 text-gray-900">
									{money((parseFloat(item.product.price) * item.quantity).toFixed(2))}
								</span>
							</li>
						{/each}
					</ul>

					<!-- Пока идёт пересчёт, прежние суммы бледнеют, но не исчезают -->
					<dl class="space-y-2 border-t border-line pt-4 text-body-sm transition-opacity {quotePending ? 'opacity-60' : ''}" aria-busy={quotePending}>
						<div class="flex justify-between text-gray-600">
							<dt>Товары</dt>
							<dd>{money(subtotal)}</dd>
						</div>
						{#if discount > 0}
							<div class="flex justify-between text-positive">
								<dt>Скидка по промокоду</dt>
								<dd>−{money(quote?.discountAmount ?? '0')}</dd>
							</div>
						{/if}
						{#if deliveryType === 'delivery' && deliveryCost !== null}
							<div class="flex justify-between text-gray-600">
								<dt>Доставка</dt>
								<dd>{deliveryCost > 0 ? money(deliveryCost) : 'Бесплатно'}</dd>
							</div>
						{:else if deliveryType === 'pickup'}
							<div class="flex justify-between text-gray-600">
								<dt>Самовывоз</dt>
								<dd>Бесплатно</dd>
							</div>
						{/if}
						<div class="flex items-baseline justify-between border-t border-line pt-3 text-ink">
							<dt class="text-title-sm">Итого</dt>
							<dd class="text-price-md">{money(total)}</dd>
						</div>
					</dl>

					{#if quote?.freeDeliveryRemaining && deliveryType === 'delivery'}
						<p class="mt-2 text-body-sm text-gray-600">
							Добавьте товаров на&nbsp;{money(quote.freeDeliveryRemaining)}, и доставка станет бесплатной.
						</p>
					{/if}
					{#if !quote && couponCode}
						<p class="mt-2 text-body-sm text-gray-600">Сумма без скидки по промокоду</p>
					{/if}
					{#if quoteError}
						<p class="mt-2 text-body-sm text-gray-600">{quoteError}</p>
					{/if}

					{#if blockers.length > 0}
						<div
							bind:this={blockersBox}
							tabindex="-1"
							role="status"
							class="mt-4 notice-caution focus:outline-none focus-visible:ring-2 focus-visible:ring-ink"
						>
							<p class="font-medium">Чтобы оформить заказ:</p>
							<ul class="mt-1 list-disc space-y-1 pl-5">
								{#each blockers as blocker (blocker)}
									<li>{blocker}</li>
								{/each}
							</ul>
							{#if blockers.some((text) => text.includes('корзин'))}
								<a href="/cart" class="link mt-2 inline-block">Перейти в корзину</a>
							{/if}
						</div>
					{/if}

					{#if submitError}
						<div role="alert" class="mt-4 notice-error">
							{submitError}
						</div>
					{/if}

					<button
						type="button"
						onclick={handleSubmitOrder}
						disabled={isSubmitting}
						class="mt-4 w-full btn-primary btn-lg"
					>
						{isSubmitting ? 'Оформляем заказ…' : 'Оформить заказ'}
					</button>
					<p class="mt-3 text-body-sm text-gray-600">Оплата при получении. Предоплата не нужна.</p>
				</div>
			</div>
		</div>
	{/if}
</div>
