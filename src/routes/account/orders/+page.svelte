<script lang="ts">
	import { invalidateAll } from '$app/navigation';
	import { formatPrice, formatDateTime } from '$lib/utils/format';
	import OrderStatusBadge from '$lib/components/ui/OrderStatusBadge.svelte';
	import ChevronRight from '@lucide/svelte/icons/chevron-right';
	import { storeSettings } from '$lib/stores/store';
	import Pagination from '$lib/components/catalog/Pagination.svelte';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	const currency = $derived($storeSettings?.currency || 'RUB');
	const totalPages = $derived(Math.max(1, Math.ceil(data.total / data.limit)));
</script>

<svelte:head>
	<title>Мои заказы — Личный кабинет</title>
	<meta name="robots" content="noindex" />
</svelte:head>

<div class="rounded-2xl bg-surface p-5 md:p-6">
	<h1 class="text-headline text-ink mb-6">Мои заказы</h1>

	{#if data.failed}
		<div class="text-center py-12" role="alert">
			<p class="text-title-sm text-ink">Не удалось загрузить заказы</p>
			<p class="mt-1 mb-4 text-body-sm text-gray-600">Проверьте соединение и попробуйте ещё раз.</p>
			<button type="button" onclick={() => invalidateAll()} class="btn-primary">Повторить</button>
		</div>
	{:else if data.orders.length === 0}
		<div class="text-center py-12">
			<p class="text-title-sm text-ink">Заказов пока нет</p>
			<p class="mt-1 mb-5 text-body-sm text-gray-600">Здесь появятся оформленные заказы и их статусы.</p>
			<a href="/catalog" class="btn-primary">Перейти в каталог</a>
		</div>
	{:else}
		<!-- Строки заказов — плоские плитки 12px внутри панели: без рамки и тени (Flat-At-Rest) -->
		<ul class="space-y-2">
			{#each data.orders as order (order.id)}
				<li>
					<a
						href="/account/orders/{order.id}"
						class="flex items-center gap-4 rounded-xl bg-gray-50 p-4 transition-colors hover:bg-gray-100"
					>
						<div class="min-w-0 flex-1">
							<div class="flex flex-wrap items-center gap-x-3 gap-y-1.5">
								<h2 class="text-title-sm text-ink">Заказ №{order.id}</h2>
								<OrderStatusBadge status={order.status} deliveryType={order.deliveryType} />
							</div>
							<p class="mt-1.5 text-body-sm text-gray-600">
								{formatDateTime(order.createAt)} · {order.deliveryType === 'delivery' ? 'Доставка курьером' : 'Самовывоз'}
								· {order.items.reduce((sum, item) => sum + item.quantity, 0)}&nbsp;шт.
							</p>
						</div>
						<p class="shrink-0 text-price text-ink">{formatPrice(order.totalAmount, currency)}</p>
						<ChevronRight class="size-5 shrink-0 text-gray-400" aria-hidden="true" />
					</a>
				</li>
			{/each}
		</ul>

		<Pagination
			current={data.page}
			total={totalPages}
			href={(pageNumber) => (pageNumber > 1 ? `/account/orders?page=${pageNumber}` : '/account/orders')}
			label="Страницы заказов"
		/>
	{/if}
</div>
