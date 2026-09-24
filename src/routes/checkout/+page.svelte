<script lang="ts">
	import { goto } from '$app/navigation';
	import { cartStore, cartTotal } from '$lib/stores/cart';
	import { authStore } from '$lib/stores/auth';
	import { cartApi } from '$lib/api/cart';
	import { ordersApi } from '$lib/api/orders';
	import { addressesApi } from '$lib/api/addresses';
	import { locationsApi } from '$lib/api/locations';
	import type { Address, CreateAddressDto, UpdateAddressDto } from '$lib/types/common';
	import type { Location, DeliveryType, CreateOrderDto } from '$lib/types/order';
	import { formatPrice } from '$lib/utils/format';
	import { storeSettings } from '$lib/stores/store';
	import { toast } from '$lib/stores/toast';
	import { getErrorMessage } from '$lib/utils/errors';
	import AddressList from '$lib/components/checkout/AddressList.svelte';
	import AddressForm from '$lib/components/checkout/AddressForm.svelte';
	import PickupLocationSelect from '$lib/components/checkout/PickupLocationSelect.svelte';
	import CouponInput from '$lib/components/checkout/CouponInput.svelte';

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
	let discountAmount = $state<string | null>(null);
	let comment = $state('');

	// Данные
	let addresses = $state<Address[]>([]);
	let locations = $state<Location[]>([]);
	let showAddressForm = $state(false);
	let editingAddress = $state<Address | null>(null);

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

	async function loadData() {
		isLoading = true;
		loadError = null;

		try {
			const cart = await cartApi.getCart(false);
			cartStore.setCart(cart);

			const userAddresses = await addressesApi.getAddresses();
			addresses = userAddresses;

			// Адрес по умолчанию, если пользователь ещё ничего не выбрал
			if (selectedAddressId === null || !userAddresses.some((a) => a.id === selectedAddressId)) {
				const defaultAddress = userAddresses.find((a) => a.isDefault) ?? userAddresses[0];
				selectedAddressId = defaultAddress?.id ?? null;
			}

			locations = await locationsApi.getLocations({ isActive: true });
			if (selectedLocationId === null || !locations.some((l) => l.id === selectedLocationId)) {
				selectedLocationId = locations[0]?.id ?? null;
			}
		} catch (err) {
			loadError = getErrorMessage(err, 'Не удалось загрузить данные для оформления заказа');
		} finally {
			isLoading = false;
		}
	}

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

	async function handleApplyCoupon(code: string) {
		// Скидку рассчитает сервер при создании заказа; здесь только запоминаем код
		couponCode = code;
		discountAmount = null;
	}

	function handleRemoveCoupon() {
		couponCode = null;
		discountAmount = null;
	}

	async function handleSubmitOrder() {
		submitError = null;

		if (deliveryType === 'delivery' && !selectedAddressId) {
			submitError = 'Выберите адрес доставки';
			return;
		}

		if (deliveryType === 'pickup' && !selectedLocationId) {
			submitError = 'Выберите точку самовывоза';
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

			cartStore.clear();
			toast.success(`Заказ №${order.id} оформлен`);
			await goto(`/account/orders/${order.id}`);
		} catch (err) {
			submitError = getErrorMessage(err, 'Не удалось оформить заказ. Попробуйте ещё раз.');
		} finally {
			isSubmitting = false;
		}
	}
</script>

<svelte:head>
	<title>Оформление заказа</title>
	<meta name="description" content="Оформление заказа в интернет-магазине" />
	<meta name="robots" content="noindex" />
</svelte:head>

<div class="container mx-auto px-4 py-8">
	<h1 class="text-3xl font-bold text-gray-800 mb-6">Оформление заказа</h1>

	{#if isLoading}
		<div class="text-center py-12" role="status">
			<p class="text-gray-500">Загрузка данных...</p>
		</div>
	{:else if loadError}
		<div role="alert" class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
			{loadError}
		</div>
		<button
			type="button"
			onclick={loadData}
			class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
		>
			Попробовать снова
		</button>
	{:else if !$cartStore || $cartStore.items.length === 0}
		<div class="text-center py-12">
			<p class="text-gray-500 mb-4">Корзина пуста</p>
			<a href="/catalog" class="text-blue-600 hover:text-blue-800">Перейти в каталог</a>
		</div>
	{:else}
		<div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
			<!-- Основная форма -->
			<div class="lg:col-span-2 space-y-6">
				<!-- Тип доставки -->
				<fieldset class="bg-white rounded-lg shadow-md p-6 m-0 min-w-0 border-0">
					<legend class="sr-only">Способ доставки</legend>
					<h2 class="text-xl font-semibold text-gray-800 mb-4" aria-hidden="true">Способ доставки</h2>
					<div class="space-y-3">
						<label
							class="flex items-center space-x-3 p-4 border-2 rounded-lg cursor-pointer has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-blue-500 has-[:focus-visible]:ring-offset-2"
							class:border-blue-600={deliveryType === 'delivery'}
							class:border-gray-300={deliveryType !== 'delivery'}
						>
							<input
								type="radio"
								bind:group={deliveryType}
								value="delivery"
								class="text-blue-600 focus:ring-blue-500"
							/>
							<span class="flex-1 font-medium">Доставка по адресу</span>
						</label>
						<label
							class="flex items-center space-x-3 p-4 border-2 rounded-lg cursor-pointer has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-blue-500 has-[:focus-visible]:ring-offset-2"
							class:border-blue-600={deliveryType === 'pickup'}
							class:border-gray-300={deliveryType !== 'pickup'}
						>
							<input
								type="radio"
								bind:group={deliveryType}
								value="pickup"
								class="text-blue-600 focus:ring-blue-500"
							/>
							<span class="flex-1 font-medium">Самовывоз</span>
						</label>
					</div>
				</fieldset>

				<!-- Адреса доставки или точки самовывоза -->
				{#if deliveryType === 'delivery'}
					<div class="bg-white rounded-lg shadow-md p-6">
						<h2 class="text-xl font-semibold text-gray-800 mb-4">Адрес доставки</h2>

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
						<h2 class="text-xl font-semibold text-gray-800 mb-4">Точка самовывоза</h2>
						<PickupLocationSelect
							{locations}
							{selectedLocationId}
							onSelect={(id) => (selectedLocationId = id)}
						/>
					</div>
				{/if}

				<!-- Промокод -->
				<div class="bg-white rounded-lg shadow-md p-6">
					<CouponInput
						{couponCode}
						{discountAmount}
						onApply={handleApplyCoupon}
						onRemove={handleRemoveCoupon}
					/>
				</div>

				<!-- Комментарий -->
				<div class="bg-white rounded-lg shadow-md p-6">
					<label for="order-comment" class="block text-xl font-semibold text-gray-800 mb-4">
						Комментарий к заказу
					</label>
					<textarea
						id="order-comment"
						bind:value={comment}
						maxlength="2000"
						placeholder="Дополнительная информация для доставки..."
						rows="4"
						class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
					></textarea>
				</div>
			</div>

			<!-- Итого -->
			<div class="lg:col-span-1">
				<div class="bg-white rounded-lg shadow-md p-6 sticky top-4">
					<h2 class="text-xl font-semibold text-gray-800 mb-4">Ваш заказ</h2>

					<ul class="space-y-2 mb-4">
						{#each $cartStore.items as item (item.id)}
							<li class="flex justify-between gap-3 text-sm">
								<span class="text-gray-600 min-w-0 break-words">
									{item.product.name} × {item.quantity}
								</span>
								<span class="font-medium shrink-0">
									{formatPrice(
										(parseFloat(item.product.price) * item.quantity).toFixed(2),
										$storeSettings?.currency || 'RUB'
									)}
								</span>
							</li>
						{/each}
					</ul>

					<div class="border-t pt-4 mb-4">
						<div class="flex justify-between text-lg font-bold text-gray-900">
							<span>Итого:</span>
							<span>
								{formatPrice($cartTotal, $storeSettings?.currency || 'RUB')}
							</span>
						</div>
						{#if couponCode}
							<p class="mt-1 text-xs text-gray-500">Скидка по промокоду будет рассчитана при оформлении</p>
						{/if}
					</div>

					{#if submitError}
						<div role="alert" class="mb-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded text-sm">
							{submitError}
						</div>
					{/if}

					<button
						type="button"
						onclick={handleSubmitOrder}
						disabled={isSubmitting}
						class="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
					>
						{isSubmitting ? 'Оформление...' : 'Оформить заказ'}
					</button>
				</div>
			</div>
		</div>
	{/if}
</div>
