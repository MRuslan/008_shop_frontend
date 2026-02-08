<script lang="ts">
	import { ordersApi } from '$lib/api/orders';
	import type { Order, OrderStatus } from '$lib/types/order';
	import { formatPrice, formatDateTime } from '$lib/utils/format';
	import { storeSettings } from '$lib/stores/store';
	import { goto, invalidateAll } from '$app/navigation';

	interface Props {
		data: {
			orders: Order[];
		};
	}

	let { data }: Props = $props();

	let selectedStatus = $state<string>('');
	let dateFrom = $state('');
	let dateTo = $state('');

	function getStatusLabel(status: OrderStatus): string {
		const labels: Record<OrderStatus, string> = {
			pending: 'Ожидает подтверждения',
			confirmed: 'Подтверждён',
			shipped: 'Передан в доставку',
			delivered: 'Доставлен',
			cancelled: 'Отменён'
		};
		return labels[status] || status;
	}

	function getStatusColor(status: OrderStatus): string {
		const colors: Record<OrderStatus, string> = {
			pending: 'bg-yellow-100 text-yellow-800',
			confirmed: 'bg-blue-100 text-blue-800',
			shipped: 'bg-purple-100 text-purple-800',
			delivered: 'bg-green-100 text-green-800',
			cancelled: 'bg-red-100 text-red-800'
		};
		return colors[status] || 'bg-gray-100 text-gray-800';
	}

	async function handleStatusChange(orderId: number, newStatus: OrderStatus) {
		if (!confirm(`Изменить статус заказа на "${getStatusLabel(newStatus)}"?`)) return;

		try {
			await ordersApi.updateOrderStatus(orderId, { status: newStatus });
			await invalidateAll();
		} catch (error: any) {
			alert(error.message || 'Ошибка изменения статуса');
		}
	}

	function applyFilters() {
		const params = new URLSearchParams();
		if (selectedStatus) params.set('status', selectedStatus);
		if (dateFrom) params.set('dateFrom', dateFrom);
		if (dateTo) params.set('dateTo', dateTo);
		goto(`/admin/orders?${params.toString()}`);
	}
</script>

<svelte:head>
	<title>Управление заказами - Админ-панель</title>
</svelte:head>

<div class="bg-white rounded-lg shadow-md p-6">
	<h1 class="text-2xl font-bold text-gray-800 mb-6">Управление заказами</h1>

	<!-- Фильтры -->
	<div class="mb-6 grid grid-cols-1 md:grid-cols-4 gap-4">
		<select
			bind:value={selectedStatus}
			class="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
		>
			<option value="">Все статусы</option>
			<option value="pending">Ожидает подтверждения</option>
			<option value="confirmed">Подтверждён</option>
			<option value="shipped">Передан в доставку</option>
			<option value="delivered">Доставлен</option>
			<option value="cancelled">Отменён</option>
		</select>
		<input
			type="date"
			bind:value={dateFrom}
			placeholder="Дата от"
			class="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
		/>
		<input
			type="date"
			bind:value={dateTo}
			placeholder="Дата до"
			class="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
		/>
		<button
			onclick={applyFilters}
			class="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
		>
			Применить
		</button>
	</div>

	<!-- Таблица заказов -->
	<div class="overflow-x-auto">
		<table class="min-w-full divide-y divide-gray-200">
			<thead class="bg-gray-50">
				<tr>
					<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
					<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Дата</th>
					<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Статус</th>
					<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Доставка</th>
					<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Сумма</th>
					<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Действия</th>
				</tr>
			</thead>
			<tbody class="bg-white divide-y divide-gray-200">
				{#each data.orders as order}
					<tr class="hover:bg-gray-50">
						<td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
							#{order.id}
						</td>
						<td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
							{formatDateTime(order.createAt)}
						</td>
						<td class="px-6 py-4 whitespace-nowrap">
							<select
								value={order.status}
								onchange={(e) => handleStatusChange(order.id, e.currentTarget.value as OrderStatus)}
								class="text-sm px-2 py-1 rounded {getStatusColor(order.status)} border-0 focus:outline-none focus:ring-2 focus:ring-blue-500"
							>
								<option value="pending">Ожидает подтверждения</option>
								<option value="confirmed">Подтверждён</option>
								<option value="shipped">Передан в доставку</option>
								<option value="delivered">Доставлен</option>
								<option value="cancelled">Отменён</option>
							</select>
						</td>
						<td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
							{order.deliveryType === 'delivery' ? 'Доставка' : 'Самовывоз'}
						</td>
						<td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
							{formatPrice(order.totalAmount, $storeSettings?.currency || 'RUB')}
						</td>
						<td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
							<a
								href="/account/orders/{order.id}"
								class="text-blue-600 hover:text-blue-900"
							>
								Просмотр
							</a>
						</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>

	{#if data.orders.length === 0}
		<div class="text-center py-8 text-gray-500">
			Заказы не найдены
		</div>
	{/if}
</div>
