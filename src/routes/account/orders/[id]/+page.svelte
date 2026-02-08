<script lang="ts">
	import type { Order } from '$lib/types/order';
	import { formatPrice, formatDateTime } from '$lib/utils/format';
	import { storeSettings } from '$lib/stores/store';

	interface Props {
		data: {
			order: Order;
		};
	}

	let { data }: Props = $props();

	function getStatusLabel(status: Order['status']): string {
		const labels: Record<Order['status'], string> = {
			pending: 'Ожидает подтверждения',
			confirmed: 'Подтверждён',
			shipped: 'Передан в доставку',
			delivered: 'Доставлен',
			cancelled: 'Отменён'
		};
		return labels[status] || status;
	}

	function getStatusColor(status: Order['status']): string {
		const colors: Record<Order['status'], string> = {
			pending: 'bg-yellow-100 text-yellow-800',
			confirmed: 'bg-blue-100 text-blue-800',
			shipped: 'bg-purple-100 text-purple-800',
			delivered: 'bg-green-100 text-green-800',
			cancelled: 'bg-red-100 text-red-800'
		};
		return colors[status] || 'bg-gray-100 text-gray-800';
	}
</script>

<svelte:head>
	<title>Заказ №{data.order.id} - Личный кабинет</title>
	<meta name="description" content="Детали заказа №{data.order.id}" />
</svelte:head>

<div class="space-y-6">
	<!-- Заголовок -->
	<div class="bg-white rounded-lg shadow-md p-6">
		<div class="flex items-center justify-between mb-4">
			<h1 class="text-2xl font-bold text-gray-800">Заказ №{data.order.id}</h1>
			<span
				class="px-3 py-1 rounded-full text-sm font-medium {getStatusColor(data.order.status)}"
			>
				{getStatusLabel(data.order.status)}
			</span>
		</div>
		
		<div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
			<div>
				<span class="text-gray-500">Дата оформления:</span>
				<span class="ml-2 text-gray-900">{formatDateTime(data.order.createAt)}</span>
			</div>
			<div>
				<span class="text-gray-500">Тип доставки:</span>
				<span class="ml-2 text-gray-900">
					{data.order.deliveryType === 'delivery' ? 'Доставка по адресу' : 'Самовывоз'}
				</span>
			</div>
		</div>
	</div>

	<!-- Товары -->
	<div class="bg-white rounded-lg shadow-md p-6">
		<h2 class="text-lg font-semibold text-gray-800 mb-4">Товары в заказе</h2>
		<div class="space-y-4">
			{#each data.order.items as item}
				<div class="flex items-center space-x-4 pb-4 border-b border-gray-200 last:border-0">
					<div class="flex-1">
						<a
							href="/products/{item.product?.slug || '#'}"
							class="text-lg font-medium text-gray-800 hover:text-blue-600"
						>
							{item.productName}
						</a>
						<p class="text-sm text-gray-600">Количество: {item.quantity}</p>
					</div>
					<div class="text-right">
						<p class="text-lg font-semibold text-gray-900">
							{formatPrice(item.price, $storeSettings?.currency || 'RUB')}
						</p>
						<p class="text-sm text-gray-600">
							Итого: {formatPrice(
								(parseFloat(item.price) * item.quantity).toFixed(2),
								$storeSettings?.currency || 'RUB'
							)}
						</p>
					</div>
				</div>
			{/each}
		</div>
	</div>

	<!-- Информация о доставке -->
	{#if data.order.deliveryType === 'delivery' && data.order.deliveryAddressSnapshot}
		<div class="bg-white rounded-lg shadow-md p-6">
			<h2 class="text-lg font-semibold text-gray-800 mb-4">Адрес доставки</h2>
			<div class="text-sm text-gray-600 space-y-1">
				<p>{data.order.deliveryAddressSnapshot.label}</p>
				<p>
					{data.order.deliveryAddressSnapshot.city}, {data.order.deliveryAddressSnapshot.street}, д. {data.order.deliveryAddressSnapshot.building}
					{#if data.order.deliveryAddressSnapshot.apartment}, кв. {data.order.deliveryAddressSnapshot.apartment}{/if}
				</p>
				{#if data.order.deliveryAddressSnapshot.postalCode}
					<p>Индекс: {data.order.deliveryAddressSnapshot.postalCode}</p>
				{/if}
				<p>Телефон: {data.order.deliveryAddressSnapshot.phone}</p>
			</div>
		</div>
	{:else if data.order.deliveryType === 'pickup' && data.order.pickupLocation}
		<div class="bg-white rounded-lg shadow-md p-6">
			<h2 class="text-lg font-semibold text-gray-800 mb-4">Точка самовывоза</h2>
			<div class="text-sm text-gray-600 space-y-1">
				<p class="font-medium text-gray-800">{data.order.pickupLocation.name}</p>
				<p>
					{data.order.pickupLocation.city}, {data.order.pickupLocation.street}, д. {data.order.pickupLocation.building}
					{#if data.order.pickupLocation.apartment}, {data.order.pickupLocation.apartment}{/if}
				</p>
				<p>Телефон: {data.order.pickupLocation.phone}</p>
			</div>
		</div>
	{/if}

	<!-- Итого -->
	<div class="bg-white rounded-lg shadow-md p-6">
		<h2 class="text-lg font-semibold text-gray-800 mb-4">Итого</h2>
		<div class="space-y-2">
			<div class="flex justify-between text-gray-600">
				<span>Сумма товаров:</span>
				<span>
					{formatPrice(
						(parseFloat(data.order.totalAmount) + (data.order.discountAmount ? parseFloat(data.order.discountAmount) : 0)).toFixed(2),
						$storeSettings?.currency || 'RUB'
					)}
				</span>
			</div>
			{#if data.order.discountAmount && parseFloat(data.order.discountAmount) > 0}
				<div class="flex justify-between text-green-600">
					<span>Скидка {#if data.order.couponCode}({data.order.couponCode}){/if}:</span>
					<span>-{formatPrice(data.order.discountAmount, $storeSettings?.currency || 'RUB')}</span>
				</div>
			{/if}
			<div class="flex justify-between text-lg font-bold text-gray-900 border-t pt-2">
				<span>Итого к оплате:</span>
				<span>{formatPrice(data.order.totalAmount, $storeSettings?.currency || 'RUB')}</span>
			</div>
		</div>
	</div>

	<!-- Комментарий -->
	{#if data.order.comment}
		<div class="bg-white rounded-lg shadow-md p-6">
			<h2 class="text-lg font-semibold text-gray-800 mb-4">Комментарий к заказу</h2>
			<p class="text-sm text-gray-600">{data.order.comment}</p>
		</div>
	{/if}
</div>
