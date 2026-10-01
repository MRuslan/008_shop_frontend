<script lang="ts">
	import { ordersApi } from '$lib/api/orders';
	import type { Order, OrderStatus } from '$lib/types/order';
	import { formatPrice, formatDateTime } from '$lib/utils/format';
	import { storeSettings } from '$lib/stores/store';
	import { goto, invalidateAll } from '$app/navigation';
	import { getErrorMessage } from '$lib/utils/errors';
	import { toast } from '$lib/stores/toast';
	import { confirmDialog } from '$lib/stores/confirm';
	import {
		orderStatusLabel,
		orderStatusFilterLabel,
		ORDER_STATUSES,
		ORDER_STATUS_TONE,
		ORDER_TRANSITIONS
	} from '$lib/utils/order-status';
	import Pagination from '$lib/components/catalog/Pagination.svelte';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	// Поля фильтра стартуют со значений из адреса и дальше живут своей жизнью до «Применить»
	let selectedStatus = $derived(data.filters.status);
	let dateFrom = $derived(data.filters.dateFrom);
	let dateTo = $derived(data.filters.dateTo);

	const totalPages = $derived(Math.max(1, Math.ceil(data.total / data.limit)));

	function pageHref(pageNumber: number): string {
		const params = new URLSearchParams();
		if (data.filters.status) params.set('status', data.filters.status);
		if (data.filters.dateFrom) params.set('dateFrom', data.filters.dateFrom);
		if (data.filters.dateTo) params.set('dateTo', data.filters.dateTo);
		if (pageNumber > 1) params.set('page', String(pageNumber));
		const query = params.toString();
		return query ? `/admin/orders?${query}` : '/admin/orders';
	}

	async function handleStatusChange(order: Order, select: HTMLSelectElement) {
		const newStatus = select.value as OrderStatus;
		if (newStatus === order.status) return;

		const label = orderStatusLabel(newStatus, order.deliveryType);
		const confirmed = await confirmDialog({
			title: `Изменить статус заказа №${order.id}?`,
			message: `Новый статус: ${label}. Покупатель получит письмо.${
				newStatus === 'cancelled' ? ' Остатки вернутся на точку, с которой были списаны.' : ''
			}`,
			confirmLabel: 'Изменить',
			danger: newStatus === 'cancelled'
		});

		if (!confirmed) {
			// Пользователь передумал: возвращаем селект к текущему статусу
			select.value = order.status;
			return;
		}

		try {
			await ordersApi.updateOrderStatus(order.id, { status: newStatus });
			await invalidateAll();
			toast.success(`Статус заказа №${order.id}: ${label}`);
		} catch (err) {
			select.value = order.status;
			toast.error(getErrorMessage(err, 'Не удалось изменить статус заказа'));
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
	<h1 class="text-headline text-ink mb-6">Управление заказами</h1>

	<!-- Фильтры -->
	<div class="mb-6 grid grid-cols-1 md:grid-cols-4 gap-4">
		<select
			bind:value={selectedStatus}
			class="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
		>
			<option value="">Все статусы</option>
			{#each ORDER_STATUSES as status (status)}
				<option value={status}>{orderStatusFilterLabel(status)}</option>
			{/each}
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
				{#each data.orders as order (order.id)}
					{@const transitions = ORDER_TRANSITIONS[order.status]}
					<tr class="hover:bg-gray-50">
						<td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
							#{order.id}
						</td>
						<td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
							{formatDateTime(order.createAt)}
						</td>
						<td class="px-6 py-4 whitespace-nowrap">
							<!-- В списке только переходы, которые примет бэкенд; конечный статус — просто метка -->
							{#if transitions.length > 0}
								<select
									value={order.status}
									aria-label="Статус заказа №{order.id}"
									onchange={(e) => handleStatusChange(order, e.currentTarget)}
									class="text-base md:text-sm px-2 py-1 rounded {ORDER_STATUS_TONE[order.status]} border-0 focus:outline-none focus:ring-2 focus:ring-blue-500"
								>
									{#each [order.status, ...transitions] as status (status)}
										<option value={status}>{orderStatusLabel(status, order.deliveryType)}</option>
									{/each}
								</select>
							{:else}
								<span class="inline-block px-2 py-1 rounded text-sm {ORDER_STATUS_TONE[order.status]}">
									{orderStatusLabel(order.status, order.deliveryType)}
								</span>
							{/if}
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

	{#if data.failed}
		<div class="text-center py-8" role="alert">
			<p class="text-gray-700">Не удалось загрузить заказы.</p>
			<button type="button" onclick={() => invalidateAll()} class="mt-2 text-blue-600 underline underline-offset-4">
				Повторить
			</button>
		</div>
	{:else if data.orders.length === 0}
		<div class="text-center py-8 text-gray-500">
			Заказы не найдены
		</div>
	{/if}

	<Pagination current={data.page} total={totalPages} href={pageHref} label="Страницы заказов" />
</div>
