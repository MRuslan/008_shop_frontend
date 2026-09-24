<script lang="ts">
	import { invalidateAll } from '$app/navigation';
	import { navigating } from '$app/state';
	import ProductList from '$lib/components/product/ProductList.svelte';
	import SortTabs, { type SortValue } from '$lib/components/catalog/SortTabs.svelte';
	import Pagination from '$lib/components/catalog/Pagination.svelte';
	import type { Product, ProductFilters } from '$lib/types/product';
	import { pluralize } from '$lib/utils/format';

	interface Props {
		data: {
			query: string;
			products: Product[];
			total: number;
			page: number;
			limit: number;
			filters: ProductFilters;
			loadError: string | null;
		};
	}

	let { data }: Props = $props();

	const totalPages = $derived(Math.max(1, Math.ceil(data.total / data.limit)));
	const sortValue = $derived(`${data.filters.sortBy || 'createAt'}-${data.filters.sortOrder || 'DESC'}`);
	const totalLabel = $derived(`${data.total} ${pluralize(data.total, ['товар', 'товара', 'товаров'])}`);

	// Запрос правится в поле поиска в шапке: страница только показывает результат
	function buildUrl(pageNumber: number, sort: string): string {
		const params = new URLSearchParams();
		if (data.query) params.set('q', data.query);
		if (sort !== 'createAt-DESC') {
			const [sortBy, sortOrder] = sort.split('-');
			params.set('sortBy', sortBy);
			params.set('sortOrder', sortOrder);
		}
		if (pageNumber > 1) params.set('page', pageNumber.toString());
		return `/search?${params.toString()}`;
	}

	const isUpdating = $derived(navigating.to?.url.pathname === '/search');

	let retrying = $state(false);

	async function retry() {
		retrying = true;
		try {
			await invalidateAll();
		} finally {
			retrying = false;
		}
	}
</script>

<svelte:head>
	<title>{data.query ? `Поиск «${data.query}»` : 'Поиск товаров'} | Каталог</title>
	<meta name="description" content="Результаты поиска товаров" />
	<meta name="robots" content="noindex, follow" />
</svelte:head>

<div class="container py-4 md:py-6">
	{#if data.query}
		<div class="flex flex-wrap items-baseline gap-x-3 gap-y-1">
			<h1 class="text-2xl font-semibold tracking-tight text-balance text-ink md:text-3xl">«{data.query}»</h1>
			{#if !data.loadError}
				<p class="text-gray-500" role="status">{totalLabel}</p>
			{/if}
		</div>
	{:else}
		<h1 class="text-2xl font-semibold tracking-tight text-ink md:text-3xl">Поиск товаров</h1>
	{/if}

	{#if data.loadError}
		<div role="alert" class="mt-4 rounded-2xl bg-surface p-8 text-center">
			<p class="font-semibold text-ink">Не удалось выполнить поиск</p>
			<p class="mt-1 text-sm text-gray-600">{data.loadError}</p>
			<button
				type="button"
				onclick={retry}
				disabled={retrying}
				class="mt-5 inline-flex h-11 items-center rounded-xl bg-ink px-5 text-sm font-medium text-white transition-colors hover:bg-ink-hover disabled:cursor-not-allowed disabled:opacity-60"
			>
				{retrying ? 'Обновляем…' : 'Попробовать снова'}
			</button>
		</div>
	{:else if !data.query}
		<p class="mt-2 text-gray-600">Введите название товара в поле поиска вверху страницы.</p>
	{:else if data.products.length === 0}
		<div class="mt-4 rounded-2xl bg-surface px-6 py-12 text-center">
			<p class="font-semibold text-ink">По запросу «{data.query}» ничего не нашлось</p>
			<p class="mt-1 text-sm text-gray-600">Проверьте написание или поищите похожее в каталоге.</p>
			<a
				href="/catalog"
				class="mt-5 inline-flex h-11 items-center rounded-xl bg-ink px-5 text-sm font-medium text-white transition-colors hover:bg-ink-hover"
			>
				Открыть каталог
			</a>
		</div>
	{:else}
		<div class="mt-3 mb-3 lg:mt-5">
			<SortTabs value={sortValue} href={(value: SortValue) => buildUrl(1, value)} />
		</div>
		<div class="transition-opacity duration-200 {isUpdating ? 'opacity-60' : ''}" aria-busy={isUpdating}>
			<ProductList products={data.products} />
		</div>
		<Pagination
			current={data.page}
			total={totalPages}
			href={(pageNumber) => buildUrl(pageNumber, sortValue)}
			label="Страницы результатов"
		/>
	{/if}
</div>
