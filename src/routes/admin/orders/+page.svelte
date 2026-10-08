<script lang="ts">
	import { ordersApi } from '$lib/api/orders';
	import type { Order, OrderStatus } from '$lib/types/order';
	import { formatPrice, formatDateTime } from '$lib/utils/format';
	import { storeSettings } from '$lib/stores/store';
	import { goto, invalidateAll } from '$app/navigation';
	import { getErrorMessage } from '$lib/utils/errors';
	import { toast } from '$lib/stores/toast';
	import { notifications, unreadNewOrders, isNewShopOrder } from '$lib/stores/notifications';
	import { confirmDialog } from '$lib/stores/confirm';
	import {
		orderStatusLabel,
		orderStatusFilterLabel,
		ORDER_STATUSES,
		ORDER_TRANSITIONS
	} from '$lib/utils/order-status';
	import Pagination from '$lib/components/catalog/Pagination.svelte';
	import OrderStatusBadge from '$lib/components/ui/OrderStatusBadge.svelte';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	// Список заказов перед глазами (он сам обновляется при новом заказе): уведомления о новых заказах
	// прочитаны, значок у раздела в меню гаснет
	$effect(() => {
		if ($unreadNewOrders > 0) void notifications.markReadWhere(isNewShopOrder);
	});

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
		// Даты, введённые с клавиатуры, могут прийти наоборот: перевёрнутый диапазон дал бы пустой список
		if (dateFrom && dateTo && dateFrom > dateTo) [dateFrom, dateTo] = [dateTo, dateFrom];
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

<div class="rounded-2xl bg-surface p-5 md:p-6">
	<h1 class="text-headline text-ink mb-6">Управление заказами</h1>

	<!-- Фильтры -->
	<div class="mb-6 grid grid-cols-1 gap-4 md:grid-cols-4 md:items-end">
		<div>
			<label for="orders-status" class="field-label">Статус</label>
			<select id="orders-status" bind:value={selectedStatus} class="w-full field">
				<option value="">Все статусы</option>
				{#each ORDER_STATUSES as status (status)}
					<option value={status}>{orderStatusFilterLabel(status)}</option>
				{/each}
			</select>
		</div>
		<div>
			<label for="orders-date-from" class="field-label">Созданы с</label>
			<input id="orders-date-from" type="date" bind:value={dateFrom} max={dateTo || undefined} class="w-full field" />
		</div>
		<div>
			<label for="orders-date-to" class="field-label">Созданы по</label>
			<input id="orders-date-to" type="date" bind:value={dateTo} min={dateFrom || undefined} class="w-full field" />
		</div>
		<button
			onclick={applyFilters}
			class="btn-primary"
		>
			Применить
		</button>
	</div>

	<!-- Таблица заказов -->
	<div class="overflow-x-auto">
		<table class="min-w-full divide-y divide-line text-left">
			<thead class="bg-gray-50">
				<tr>
					<th class="text-left font-medium text-gray-500 px-4 py-3 text-label">ID</th>
					<th class="text-left font-medium text-gray-500 px-4 py-3 text-label">Дата</th>
					<th class="text-left font-medium text-gray-500 px-4 py-3 text-label">Статус</th>
					<th class="text-left font-medium text-gray-500 px-4 py-3 text-label">Доставка</th>
					<th class="text-left font-medium text-gray-500 px-4 py-3 text-label">Сумма</th>
					<th class="text-left font-medium text-gray-500 px-4 py-3 text-label">Действия</th>
				</tr>
			</thead>
			<tbody class="divide-y divide-line">
				{#each data.orders as order (order.id)}
					{@const transitions = ORDER_TRANSITIONS[order.status]}
					<tr class="hover:bg-gray-50">
						<td class="whitespace-nowrap text-body-sm font-medium text-gray-900 px-4 py-3">
							#{order.id}
						</td>
						<td class="whitespace-nowrap text-body-sm text-gray-500 px-4 py-3">
							{formatDateTime(order.createAt)}
						</td>
						<td class="whitespace-nowrap px-4 py-3">
							<!-- В списке только переходы, которые примет бэкенд; конечный статус — просто метка -->
							{#if transitions.length > 0}
								<select
									value={order.status}
									aria-label="Статус заказа №{order.id}"
									onchange={(e) => handleStatusChange(order, e.currentTarget)}
									class="field min-h-10 py-1.5"
								>
									{#each [order.status, ...transitions] as status (status)}
										<option value={status}>{orderStatusLabel(status, order.deliveryType)}</option>
									{/each}
								</select>
							{:else}
								<OrderStatusBadge status={order.status} deliveryType={order.deliveryType} />
							{/if}
						</td>
						<td class="whitespace-nowrap text-body-sm text-gray-500 px-4 py-3">
							{order.deliveryType === 'delivery' ? 'Доставка' : 'Самовывоз'}
						</td>
						<td class="whitespace-nowrap text-body-sm font-medium text-gray-900 px-4 py-3">
							{formatPrice(order.totalAmount, $storeSettings?.currency || 'RUB')}
						</td>
						<td class="whitespace-nowrap text-body-sm font-medium px-4 py-3">
							<a
								href="/account/orders/{order.id}"
								class="link"
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
			<button type="button" onclick={() => invalidateAll()} class="mt-2 btn-text">
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
