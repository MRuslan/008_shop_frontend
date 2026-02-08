<script lang="ts">
	import { onMount } from 'svelte';
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
	import AddressList from '$lib/components/checkout/AddressList.svelte';
	import AddressForm from '$lib/components/checkout/AddressForm.svelte';
	import PickupLocationSelect from '$lib/components/checkout/PickupLocationSelect.svelte';
	import CouponInput from '$lib/components/checkout/CouponInput.svelte';

	let isLoading = $state(true);
	let isSubmitting = $state(false);
	let error = $state<string | null>(null);

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

	onMount(async () => {
		// Проверка авторизации
		if (!$authStore.isAuthenticated) {
			goto('/cart?redirect=/checkout');
			return;
		}

		// Проверка корзины
		if (!$cartStore || $cartStore.items.length === 0) {
			goto('/cart');
			return;
		}

		await loadData();
	});

	async function loadData() {
		isLoading = true;
		error = null;

		try {
			// Загружаем корзину
			const cart = await cartApi.getCart(false);
			cartStore.setCart(cart);

			// Загружаем адреса
			const userAddresses = await addressesApi.getAddresses();
			addresses = userAddresses;
			
			// Выбираем адрес по умолчанию
			const defaultAddress = userAddresses.find((a) => a.isDefault);
			if (defaultAddress) {
				selectedAddressId = defaultAddress.id;
			} else if (userAddresses.length > 0) {
				selectedAddressId = userAddresses[0].id;
			}

			// Загружаем точки самовывоза
			locations = await locationsApi.getLocations({ isActive: true });
			
			if (locations.length > 0) {
				selectedLocationId = locations[0].id;
			}
		} catch (err: any) {
			error = err.message || 'Ошибка загрузки данных';
		} finally {
			isLoading = false;
		}
	}

	async function handleSaveAddress(data: CreateAddressDto | UpdateAddressDto) {
		try {
			if (editingAddress) {
				await addressesApi.updateAddress(editingAddress.id, data);
			} else {
				await addressesApi.createAddress(data as CreateAddressDto);
			}
			
			await loadData();
			showAddressForm = false;
			editingAddress = null;
		} catch (err: any) {
			throw new Error(err.message || 'Ошибка сохранения адреса');
		}
	}

	async function handleDeleteAddress(addressId: number) {
		try {
			await addressesApi.deleteAddress(addressId);
			await loadData();
			
			if (selectedAddressId === addressId) {
				selectedAddressId = addresses.length > 0 ? addresses[0].id : null;
			}
		} catch (err: any) {
			error = err.message || 'Ошибка удаления адреса';
		}
	}

	async function handleApplyCoupon(code: string) {
		// Промокод будет применён на сервере при создании заказа
		// Здесь просто сохраняем код
		couponCode = code;
		discountAmount = null; // Скидка будет рассчитана на сервере
	}

	function handleRemoveCoupon() {
		couponCode = null;
		discountAmount = null;
	}

	async function handleSubmitOrder() {
		error = null;

		// Валидация
		if (deliveryType === 'delivery' && !selectedAddressId) {
			error = 'Выберите адрес доставки';
			return;
		}

		if (deliveryType === 'pickup' && !selectedLocationId) {
			error = 'Выберите точку самовывоза';
			return;
		}

		isSubmitting = true;

		try {
			const orderData: CreateOrderDto = {
				deliveryType,
				deliveryAddressId: deliveryType === 'delivery' ? selectedAddressId || undefined : undefined,
				pickupLocationId: deliveryType === 'pickup' ? selectedLocationId || undefined : undefined,
				couponCode: couponCode || undefined,
				comment: comment.trim() || undefined
			};

			const order = await ordersApi.createOrder(orderData);
			
			// Очищаем корзину
			cartStore.clear();
			
			// Перенаправляем на страницу заказа
			goto(`/account/orders/${order.id}`);
		} catch (err: any) {
			const message = err.message || 'Ошибка оформления заказа';
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
	<title>Оформление заказа</title>
	<meta name="description" content="Оформление заказа в интернет-магазине" />
</svelte:head>

<div class="container mx-auto px-4 py-8">
	<h1 class="text-3xl font-bold text-gray-800 mb-6">Оформление заказа</h1>

	{#if isLoading}
		<div class="text-center py-12">
			<p class="text-gray-500">Загрузка данных...</p>
		</div>
	{:else if error && !isSubmitting}
		<div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
			{error}
		</div>
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
				<div class="bg-white rounded-lg shadow-md p-6">
					<h2 class="text-xl font-semibold text-gray-800 mb-4">Способ доставки</h2>
					<div class="space-y-3">
						<label class="flex items-center space-x-3 p-4 border-2 rounded-lg cursor-pointer"
							class:border-blue-600={deliveryType === 'delivery'}
							class:border-gray-300={deliveryType !== 'delivery'}
						>
							<input
								type="radio"
								bind:group={deliveryType}
								value="delivery"
								class="text-blue-600 focus:ring-blue-500"
							/>
							<div class="flex-1">
								<span class="font-medium">Доставка по адресу</span>
							</div>
						</label>
						<label class="flex items-center space-x-3 p-4 border-2 rounded-lg cursor-pointer"
							class:border-blue-600={deliveryType === 'pickup'}
							class:border-gray-300={deliveryType !== 'pickup'}
						>
							<input
								type="radio"
								bind:group={deliveryType}
								value="pickup"
								class="text-blue-600 focus:ring-blue-500"
							/>
							<div class="flex-1">
								<span class="font-medium">Самовывоз</span>
							</div>
						</label>
					</div>
				</div>

				<!-- Адреса доставки или точки самовывоза -->
				{#if deliveryType === 'delivery'}
					<div class="bg-white rounded-lg shadow-md p-6">
						<div class="flex items-center justify-between mb-4">
							<h2 class="text-xl font-semibold text-gray-800">Адрес доставки</h2>
						</div>
						
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
								selectedAddressId={selectedAddressId}
								onSelect={(id) => selectedAddressId = id}
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
							selectedLocationId={selectedLocationId}
							onSelect={(id) => selectedLocationId = id}
						/>
					</div>
				{/if}

				<!-- Промокод -->
				<div class="bg-white rounded-lg shadow-md p-6">
					<CouponInput
						couponCode={couponCode}
						discountAmount={discountAmount}
						onApply={handleApplyCoupon}
						onRemove={handleRemoveCoupon}
					/>
				</div>

				<!-- Комментарий -->
				<div class="bg-white rounded-lg shadow-md p-6">
					<h2 class="text-xl font-semibold text-gray-800 mb-4">Комментарий к заказу</h2>
					<textarea
						bind:value={comment}
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
					
					<div class="space-y-2 mb-4">
						{#each $cartStore.items as item}
							<div class="flex justify-between text-sm">
								<span class="text-gray-600">
									{item.product.name} × {item.quantity}
								</span>
								<span class="font-medium">
									{formatPrice(
										(parseFloat(item.product.price) * item.quantity).toFixed(2),
										$storeSettings?.currency || 'RUB'
									)}
								</span>
							</div>
						{/each}
					</div>

					<div class="border-t pt-4 mb-4">
						<div class="flex justify-between text-lg font-bold text-gray-900">
							<span>Итого:</span>
							<span>
								{formatPrice($cartTotal, $storeSettings?.currency || 'RUB')}
							</span>
						</div>
					</div>

					<button
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
