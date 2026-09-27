<script lang="ts">
	import type { Order } from '$lib/types/order';
	import { formatPrice, formatDateTime } from '$lib/utils/format';
	import { storeSettings } from '$lib/stores/store';

	interface Props {
		data: {
			orders: Order[];
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
	<title>Мои заказы — Личный кабинет</title>
	<meta name="robots" content="noindex" />
</svelte:head>

<div class="bg-white rounded-lg shadow-md p-6">
	<h1 class="text-headline text-ink mb-6">Мои заказы</h1>

	{#if data.orders.length === 0}
		<div class="text-center py-12">
			<p class="text-title-sm text-ink">Заказов пока нет</p>
			<p class="mt-1 mb-4 text-body-sm text-gray-600">Здесь появятся оформленные заказы и их статусы.</p>
			<a href="/catalog" class="text-blue-600 hover:text-blue-800">Перейти в каталог</a>
		</div>
	{:else}
		<div class="space-y-4">
			{#each data.orders as order (order.id)}
				<a
					href="/account/orders/{order.id}"
					class="block border border-gray-200 rounded-lg p-4 hover:border-blue-500 hover:shadow-md transition-all"
				>
					<div class="flex items-start justify-between">
						<div class="flex-1">
							<div class="flex items-center space-x-4 mb-2">
								<h2 class="text-title-sm text-ink">
									Заказ №{order.id}
								</h2>
								<span
									class="px-2 py-1 rounded text-label font-medium {getStatusColor(order.status)}"
								>
									{getStatusLabel(order.status)}
								</span>
							</div>
							
							<p class="text-sm text-gray-600 mb-1">
								{formatDateTime(order.createAt)} · {order.deliveryType === 'delivery' ? 'Доставка курьером' : 'Самовывоз'}
							</p>

							<p class="text-sm text-gray-600">
								{order.items.reduce((sum, item) => sum + item.quantity, 0)}&nbsp;шт. · {formatPrice(order.totalAmount, $storeSettings?.currency || 'RUB')}
							</p>
						</div>
						
						<svg
							aria-hidden="true"
							class="w-5 h-5 text-gray-400 ml-4"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M9 5l7 7-7 7"
							/>
						</svg>
					</div>
				</a>
			{/each}
		</div>
	{/if}
</div>
