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

	// Что будет дальше: одна строка под статусом, без обещаний, которых система не даёт
	const nextStep = $derived(
		{
			pending: 'Заказ ждёт подтверждения магазином. Оплатить его нужно будет при получении.',
			confirmed: 'Магазин подтвердил заказ. Оплата при получении.',
			shipped: 'Заказ передан в доставку. Оплата при получении.',
			delivered: 'Заказ получен. Спасибо за покупку!',
			cancelled: 'Заказ отменён.'
		}[data.order.status] ?? null
	);
</script>

<svelte:head>
	<title>Заказ №{data.order.id} — Личный кабинет</title>
	<meta name="robots" content="noindex" />
</svelte:head>

<div class="space-y-6">
	<!-- Заголовок -->
	<div class="bg-white rounded-lg shadow-md p-6">
		<div class="flex flex-wrap items-center justify-between gap-3 mb-2">
			<h1 class="text-headline text-ink">Заказ №{data.order.id}</h1>
			<span
				class="px-3 py-1 rounded-full text-label font-medium {getStatusColor(data.order.status)}"
			>
				{getStatusLabel(data.order.status)}
			</span>
		</div>
		
		{#if nextStep}
			<p class="mb-4 text-gray-700">
				{nextStep}
				{#if data.order.status === 'cancelled'}
					Если это ошибка, <a href="/contacts" class="underline underline-offset-4">свяжитесь с магазином</a>.
				{/if}
			</p>
		{/if}

		<dl class="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
			<div>
				<dt class="text-gray-500">Оформлен</dt>
				<dd class="text-gray-900">{formatDateTime(data.order.createAt)}</dd>
			</div>
			<div>
				<dt class="text-gray-500">Получение</dt>
				<dd class="text-gray-900">
					{data.order.deliveryType === 'delivery' ? 'Доставка курьером' : 'Самовывоз'}
				</dd>
			</div>
		</dl>
	</div>

	<!-- Товары -->
	<div class="bg-white rounded-lg shadow-md p-6">
		<h2 class="text-title text-ink mb-4">Товары в заказе</h2>
		<div class="space-y-4">
			{#each data.order.items as item (item.id)}
				<div class="flex items-center space-x-4 pb-4 border-b border-gray-200 last:border-0">
					<div class="flex-1">
						<a
							href="/products/{item.product?.slug || '#'}"
							class="line-clamp-2 text-body-sm sm:text-body text-gray-800 hover:text-ink"
						>
							{item.productName}
						</a>
						<p class="text-sm text-gray-600">
							{item.quantity}&nbsp;шт. × {formatPrice(item.price, $storeSettings?.currency || 'RUB')}
						</p>
					</div>
					<p class="text-right text-price text-ink">
						{formatPrice((parseFloat(item.price) * item.quantity).toFixed(2), $storeSettings?.currency || 'RUB')}
					</p>
				</div>
			{/each}
		</div>
	</div>

	<!-- Информация о доставке -->
	{#if data.order.deliveryType === 'delivery' && data.order.deliveryAddressSnapshot}
		<div class="bg-white rounded-lg shadow-md p-6">
			<h2 class="text-title text-ink mb-4">Адрес доставки</h2>
			<div class="text-sm text-gray-600 space-y-1">
				<p>{data.order.deliveryAddressSnapshot.label}</p>
				<p>
					{data.order.deliveryAddressSnapshot.city}, {data.order.deliveryAddressSnapshot.street}, д. {data.order.deliveryAddressSnapshot.building}
					{#if data.order.deliveryAddressSnapshot.apartment}, кв. {data.order.deliveryAddressSnapshot.apartment}{/if}
				</p>
				{#if data.order.deliveryAddressSnapshot.postalCode}
					<p>Индекс: {data.order.deliveryAddressSnapshot.postalCode}</p>
				{/if}
				<p>Телефон для связи: {data.order.deliveryAddressSnapshot.phone}</p>
			</div>
		</div>
	{:else if data.order.deliveryType === 'pickup' && data.order.pickupLocation}
		<div class="bg-white rounded-lg shadow-md p-6">
			<h2 class="text-title text-ink mb-4">Точка самовывоза</h2>
			<div class="text-sm text-gray-600 space-y-1">
				<p class="font-medium text-gray-800">{data.order.pickupLocation.name}</p>
				<p>
					{data.order.pickupLocation.city}, {data.order.pickupLocation.street}, д. {data.order.pickupLocation.building}
					{#if data.order.pickupLocation.apartment}, {data.order.pickupLocation.apartment}{/if}
				</p>
				<p>Телефон точки: {data.order.pickupLocation.phone}</p>
			</div>
		</div>
	{/if}

	<!-- Итого -->
	<div class="bg-white rounded-lg shadow-md p-6">
		<h2 class="text-title text-ink mb-4">Итого</h2>
		<div class="space-y-2">
			<div class="flex justify-between text-gray-600">
				<span>Товары</span>
				<span>
					{formatPrice(
						(parseFloat(data.order.totalAmount) + (data.order.discountAmount ? parseFloat(data.order.discountAmount) : 0)).toFixed(2),
						$storeSettings?.currency || 'RUB'
					)}
				</span>
			</div>
			{#if data.order.discountAmount && parseFloat(data.order.discountAmount) > 0}
				<div class="flex justify-between text-positive">
					<span>Скидка{#if data.order.couponCode} по промокоду {data.order.couponCode}{/if}</span>
					<span>-{formatPrice(data.order.discountAmount, $storeSettings?.currency || 'RUB')}</span>
				</div>
			{/if}
			<div class="flex items-baseline justify-between text-ink border-t pt-2">
				<span class="text-title-sm">
					{['pending', 'confirmed', 'shipped'].includes(data.order.status) ? 'К оплате при получении' : 'Сумма заказа'}
				</span>
				<span class="text-price-md">{formatPrice(data.order.totalAmount, $storeSettings?.currency || 'RUB')}</span>
			</div>
		</div>
	</div>

	<!-- Комментарий -->
	{#if data.order.comment}
		<div class="bg-white rounded-lg shadow-md p-6">
			<h2 class="text-title text-ink mb-4">Комментарий к заказу</h2>
			<p class="text-sm text-gray-600">{data.order.comment}</p>
		</div>
	{/if}
</div>
