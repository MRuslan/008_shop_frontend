<script lang="ts">
	import { goto } from '$app/navigation';
	import { tick } from 'svelte';
	import { cartStore, cartTotal } from '$lib/stores/cart';
	import { authStore } from '$lib/stores/auth';
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

	let isLoading = $state(true);
	let isSubmitting = $state(false);
	// Ошибка загрузки блокирует страницу, ошибка отправки показывается рядом с кнопкой и не прячет форму
	let loadError = $state<string | null>(null);
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

	let dataRequested = false;

	// Ждём инициализацию авторизации: иначе перезагрузка страницы выбрасывает залогиненного пользователя в корзину
	$effect(() => {
		if ($authStore.isLoading) return;
		if (!$authStore.isAuthenticated) {
			goto('/cart?redirect=/checkout');
			return;
		}
		if (!dataRequested) {
			dataRequested = true;
			loadData();
		}
	});

	async function loadAvailability() {
		try {
			availability = await cartApi.getAvailability(false);
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

	async function loadData() {
		isLoading = true;
		loadError = null;

		try {
			const [cart, userAddresses, allLocations] = await Promise.all([
				cartApi.getCart(false),
				addressesApi.getAddresses(),
				locationsApi.getLocations({ isActive: true }),
				loadAvailability()
			]);
			cartStore.setCart(cart);
			addresses = userAddresses;

			// Адрес по умолчанию, если пользователь ещё ничего не выбрал
			if (selectedAddressId === null || !userAddresses.some((a) => a.id === selectedAddressId)) {
				const defaultAddress = userAddresses.find((a) => a.isDefault) ?? userAddresses[0];
				selectedAddressId = defaultAddress?.id ?? null;
			}

			// Склад не выдаёт заказы: бэкенд принимает самовывоз только из пунктов выдачи и магазинов
			locations = allLocations.filter((location) => location.type !== 'warehouse');
			pickDefaultLocation();

			// Выключенный магазином способ не предлагаем по умолчанию
			if (deliveryType === 'delivery' && !deliveryEnabled && pickupEnabled) deliveryType = 'pickup';
			if (deliveryType === 'pickup' && !pickupEnabled && deliveryEnabled) deliveryType = 'delivery';
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
			void cartStore.init();
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

<div class="container mx-auto px-4 py-8">
	<h1 class="text-headline md:text-headline-lg text-balance text-ink mb-6">Оформление заказа</h1>

	{#if isLoading}
		<!-- Заглушка повторяет форму: способ получения, адрес, промокод, комментарий и итог справа -->
		<div class="grid grid-cols-1 gap-6 lg:grid-cols-3" role="status">
			<span class="sr-only">{$authStore.isLoading ? 'Проверяем вход…' : 'Загружаем адреса и точки самовывоза…'}</span>
			<div class="space-y-6 lg:col-span-2">
				<div class="rounded-lg bg-white p-6 shadow-md">
					<Skeleton class="mb-4 h-7 w-48" />
					<div class="space-y-3">
						<Skeleton class="h-[4.5rem]" />
						<Skeleton class="h-[4.5rem]" />
					</div>
				</div>
				<div class="rounded-lg bg-white p-6 shadow-md">
					<Skeleton class="mb-4 h-7 w-40" />
					<Skeleton class="h-24" />
				</div>
				<div class="rounded-lg bg-white p-6 shadow-md">
					<Skeleton class="mb-2 h-5 w-24" />
					<Skeleton class="h-11" />
				</div>
			</div>
			<div class="lg:col-span-1">
				<div class="space-y-3 rounded-lg bg-white p-6 shadow-md">
					<Skeleton class="mb-4 h-7 w-32" />
					<Skeleton class="h-5" />
					<Skeleton class="h-5 w-3/4" />
					<Skeleton class="mt-4 h-8" />
					<Skeleton class="mt-4 h-12" />
				</div>
			</div>
		</div>
	{:else if loadError}
		<div role="alert" class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
			{loadError}
		</div>
		<button
			type="button"
			onclick={loadData}
			class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-control"
		>
			Попробовать снова
		</button>
	{:else if !$cartStore || $cartStore.items.length === 0}
		<div class="text-center py-12">
			<p class="text-title-sm text-ink">В корзине пока ничего нет</p>
			<p class="mt-1 mb-4 text-body-sm text-gray-600">Чтобы оформить заказ, добавьте товары из каталога.</p>
			<a href="/catalog" class="text-blue-600 hover:text-blue-800">Перейти в каталог</a>
		</div>
	{:else}
		<div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
			<!-- Основная форма -->
			<div class="lg:col-span-2 space-y-6">
				<!-- Тип доставки -->
				<fieldset class="bg-white rounded-lg shadow-md p-6 m-0 min-w-0 border-0">
					<legend class="sr-only">Способ получения</legend>
					<h2 class="text-title text-ink mb-4" aria-hidden="true">Способ получения</h2>
					<div class="space-y-3">
						<label
							class="flex items-center space-x-3 p-4 border-2 rounded-lg has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-blue-500 has-[:focus-visible]:ring-offset-2 {deliveryEnabled
								? 'cursor-pointer'
								: 'cursor-not-allowed bg-gray-50'}"
							class:border-blue-600={deliveryType === 'delivery'}
							class:border-gray-300={deliveryType !== 'delivery'}
						>
							<input
								type="radio"
								bind:group={deliveryType}
								value="delivery"
								disabled={!deliveryEnabled}
								class="text-blue-600 focus:ring-blue-500"
							/>
							<span class="flex-1">
								<span class="block font-medium {deliveryEnabled ? '' : 'text-gray-600'}">Доставка курьером</span>
								{#if !deliveryEnabled}
									<span class="block text-sm text-gray-600">Сейчас магазин не доставляет заказы</span>
								{:else}
									<span class="block text-sm text-gray-600">Привезём по адресу, который вы укажете</span>
									{#if deliveryTerms}
										<span class="block text-sm text-gray-600">{deliveryTerms}</span>
									{/if}
								{/if}
							</span>
						</label>
						<label
							class="flex items-center space-x-3 p-4 border-2 rounded-lg has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-blue-500 has-[:focus-visible]:ring-offset-2 {pickupEnabled
								? 'cursor-pointer'
								: 'cursor-not-allowed bg-gray-50'}"
							class:border-blue-600={deliveryType === 'pickup'}
							class:border-gray-300={deliveryType !== 'pickup'}
						>
							<input
								type="radio"
								bind:group={deliveryType}
								value="pickup"
								disabled={!pickupEnabled}
								class="text-blue-600 focus:ring-blue-500"
							/>
							<span class="flex-1">
								<span class="block font-medium {pickupEnabled ? '' : 'text-gray-600'}">Самовывоз</span>
								<span class="block text-sm text-gray-600">
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
					<div class="bg-white rounded-lg shadow-md p-6">
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
					<div class="bg-white rounded-lg shadow-md p-6">
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
				<div class="bg-white rounded-lg shadow-md p-6">
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
				<div class="bg-white rounded-lg shadow-md p-6">
					<label for="order-comment" class="block text-title text-ink mb-4">
						Комментарий к заказу <span class="text-body-sm font-normal text-gray-500">(необязательно)</span>
					</label>
					<textarea
						id="order-comment"
						bind:value={comment}
						maxlength="2000"
						placeholder="Например, код домофона или удобное время для звонка"
						rows="4"
						class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
					></textarea>
				</div>
			</div>

			<!-- Итого -->
			<div class="lg:col-span-1">
				<div class="bg-white rounded-lg shadow-md p-6 sticky top-4">
					<h2 class="text-title text-ink mb-4">Ваш заказ</h2>

					<ul class="space-y-2 mb-4">
						{#each $cartStore.items as item (item.id)}
							<li class="flex justify-between gap-3 text-sm">
								<span class="text-gray-600 min-w-0 break-words">
									{item.product.name} × {item.quantity}
								</span>
								<span class="font-medium shrink-0">
									{money((parseFloat(item.product.price) * item.quantity).toFixed(2))}
								</span>
							</li>
						{/each}
					</ul>

					<!-- Пока идёт пересчёт, прежние суммы бледнеют, но не исчезают -->
					<dl class="space-y-2 border-t pt-4 text-sm transition-opacity {quotePending ? 'opacity-60' : ''}" aria-busy={quotePending}>
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
						<div class="flex items-baseline justify-between border-t pt-3 text-ink">
							<dt class="text-title-sm">Итого</dt>
							<dd class="text-price-md">{money(total)}</dd>
						</div>
					</dl>

					{#if quote?.freeDeliveryRemaining && deliveryType === 'delivery'}
						<p class="mt-2 text-sm text-gray-600">
							Добавьте товаров на&nbsp;{money(quote.freeDeliveryRemaining)}, и доставка станет бесплатной.
						</p>
					{/if}
					{#if !quote && couponCode}
						<p class="mt-2 text-sm text-gray-500">Сумма без скидки по промокоду</p>
					{/if}
					{#if quoteError}
						<p class="mt-2 text-sm text-gray-500">{quoteError}</p>
					{/if}

					{#if blockers.length > 0}
						<div
							bind:this={blockersBox}
							tabindex="-1"
							role="status"
							class="mt-4 rounded-md border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-gray-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-ink"
						>
							<p class="font-medium">Чтобы оформить заказ:</p>
							<ul class="mt-1 list-disc space-y-1 pl-5">
								{#each blockers as blocker (blocker)}
									<li>{blocker}</li>
								{/each}
							</ul>
							{#if blockers.some((text) => text.includes('корзин'))}
								<a href="/cart" class="mt-2 inline-block underline underline-offset-4">Перейти в корзину</a>
							{/if}
						</div>
					{/if}

					{#if submitError}
						<div role="alert" class="mt-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded text-sm">
							{submitError}
						</div>
					{/if}

					<button
						type="button"
						onclick={handleSubmitOrder}
						disabled={isSubmitting}
						class="mt-4 w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-control-lg"
					>
						{isSubmitting ? 'Оформляем заказ…' : 'Оформить заказ'}
					</button>
					<p class="mt-3 text-sm text-gray-500">Оплата при получении. Предоплата не нужна.</p>
				</div>
			</div>
		</div>
	{/if}
</div>
