<script lang="ts">
	import { invalidateAll } from '$app/navigation';
	import { formatPrice, formatDateTime } from '$lib/utils/format';
	import { orderStatusLabel, ORDER_STATUS_TONE } from '$lib/utils/order-status';
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

<div class="bg-white rounded-lg shadow-md p-6">
	<h1 class="text-headline text-ink mb-6">Мои заказы</h1>

	{#if data.failed}
		<div class="text-center py-12" role="alert">
			<p class="text-title-sm text-ink">Не удалось загрузить заказы</p>
			<p class="mt-1 mb-4 text-body-sm text-gray-600">Проверьте соединение и попробуйте ещё раз.</p>
			<button
				type="button"
				onclick={() => invalidateAll()}
				class="inline-flex h-11 items-center rounded-xl bg-ink px-5 text-control text-white hover:bg-ink-hover"
			>
				Повторить
			</button>
		</div>
	{:else if data.orders.length === 0}
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
							<div class="flex flex-wrap items-center gap-x-4 gap-y-1 mb-2">
								<h2 class="text-title-sm text-ink">
									Заказ №{order.id}
								</h2>
								<span class="px-2 py-1 rounded text-label font-medium {ORDER_STATUS_TONE[order.status]}">
									{orderStatusLabel(order.status, order.deliveryType)}
								</span>
							</div>

							<p class="text-sm text-gray-600 mb-1">
								{formatDateTime(order.createAt)} · {order.deliveryType === 'delivery' ? 'Доставка курьером' : 'Самовывоз'}
							</p>

							<p class="text-sm text-gray-600">
								{order.items.reduce((sum, item) => sum + item.quantity, 0)}&nbsp;шт. · {formatPrice(order.totalAmount, currency)}
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

		<Pagination
			current={data.page}
			total={totalPages}
			href={(pageNumber) => (pageNumber > 1 ? `/account/orders?page=${pageNumber}` : '/account/orders')}
			label="Страницы заказов"
		/>
	{/if}
</div>
