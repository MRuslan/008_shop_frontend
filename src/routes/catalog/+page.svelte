<script lang="ts">
	import { goto, invalidateAll } from '$app/navigation';
	import { page } from '$app/state';
	import ProductList from '$lib/components/product/ProductList.svelte';
	import ProductFilters from '$lib/components/product/ProductFilters.svelte';
	import type { Product, ProductFilters as ProductFiltersType, Category } from '$lib/types/product';
	import { storeSettings } from '$lib/stores/store';
	import { generateCollectionJsonLd, generateBreadcrumbJsonLd } from '$lib/utils/seo';

	interface Props {
		data: {
			products: Product[];
			total: number;
			page: number;
			limit: number;
			categories: Category[];
			filters: ProductFiltersType;
			loadError: string | null;
		};
	}

	let { data }: Props = $props();

	// Всё состояние страницы живёт в URL: данные приходят из load и не устаревают при навигации
	const currentPage = $derived(data.page);
	const totalPages = $derived(Math.max(1, Math.ceil(data.total / data.limit)));

	const siteUrl = $derived(page.url.origin);
	const siteName = $derived($storeSettings?.name || 'Интернет-магазин');
	const description = $derived(
		`Каталог товаров ${siteName}. Найдено товаров: ${data.total}. Широкий ассортимент по выгодным ценам.`
	);
	const breadcrumbs = [
		{ name: 'Главная', url: '/' },
		{ name: 'Каталог', url: '/catalog' }
	];

	function buildUrl(filters: ProductFiltersType, pageNumber: number): string {
		const params = new URLSearchParams();

		if (filters.search) params.set('search', filters.search);
		if (filters.categoryId) params.set('categoryId', filters.categoryId.toString());
		if (filters.minPrice) params.set('minPrice', filters.minPrice.toString());
		if (filters.maxPrice) params.set('maxPrice', filters.maxPrice.toString());
		if (filters.inStock) params.set('inStock', 'true');
		if (filters.sortBy) params.set('sortBy', filters.sortBy);
		if (filters.sortOrder) params.set('sortOrder', filters.sortOrder);
		if (pageNumber > 1) params.set('page', pageNumber.toString());
		if (filters.limit && filters.limit !== 20) params.set('limit', filters.limit.toString());

		const query = params.toString();
		return `/catalog${query ? `?${query}` : ''}`;
	}

	function handleFiltersChange(newFilters: ProductFiltersType) {
		goto(buildUrl(newFilters, 1), { noScroll: false });
	}

	function goToPage(newPage: number) {
		goto(buildUrl(data.filters, newPage), { noScroll: false });
	}

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
	<title>Каталог товаров | {siteName}</title>
	<meta name="description" content={description} />
	<meta property="og:title" content={`Каталог товаров | ${siteName}`} />
	<meta property="og:description" content={description} />
	<meta property="og:type" content="website" />
	<meta property="og:url" content={`${siteUrl}/catalog`} />
	{#if $storeSettings?.logoUrl}
		<meta property="og:image" content={$storeSettings.logoUrl} />
	{/if}
	<meta property="og:site_name" content={siteName} />
	<meta name="twitter:card" content="summary" />
	<meta name="twitter:title" content={`Каталог товаров | ${siteName}`} />
	<meta name="twitter:description" content={description} />
	<link rel="canonical" href={`${siteUrl}/catalog`} />

	{#if !data.loadError}
		{@html `<script type="application/ld+json">${JSON.stringify(generateCollectionJsonLd(data.products, null, $storeSettings, siteUrl))}</script>`}
	{/if}
	{@html `<script type="application/ld+json">${JSON.stringify(generateBreadcrumbJsonLd(breadcrumbs, siteUrl))}</script>`}
</svelte:head>

<div class="container mx-auto px-4 py-8">
	<h1 class="text-3xl font-bold text-gray-800 mb-6">Каталог товаров</h1>

	<div class="grid grid-cols-1 lg:grid-cols-4 gap-6">
		<!-- Фильтры -->
		<aside class="lg:col-span-1">
			<ProductFilters filters={data.filters} onFiltersChange={handleFiltersChange} />
		</aside>

		<!-- Товары -->
		<div class="lg:col-span-3">
			{#if data.loadError}
				<div role="alert" class="rounded-lg border border-red-200 bg-red-50 p-6 text-center">
					<p class="font-medium text-red-800">Не удалось загрузить каталог</p>
					<p class="mt-1 text-sm text-red-700">{data.loadError}</p>
					<button
						type="button"
						onclick={retry}
						disabled={retrying}
						class="mt-4 min-h-11 rounded-md bg-blue-600 px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
					>
						{retrying ? 'Обновляем…' : 'Попробовать снова'}
					</button>
				</div>
			{:else}
				<!-- Информация о результатах -->
				<p class="mb-4 text-sm text-gray-600" role="status">
					Найдено товаров: {data.total}
				</p>

				<!-- Список товаров -->
				<ProductList products={data.products} />

				<!-- Пагинация -->
				{#if totalPages > 1}
					<nav class="mt-8 flex flex-wrap justify-center items-center gap-2" aria-label="Страницы каталога">
						<button
							type="button"
							onclick={() => goToPage(currentPage - 1)}
							disabled={currentPage === 1}
							class="min-h-11 px-4 py-2 border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
						>
							Назад
						</button>

						{#each Array.from({ length: totalPages }, (_, i) => i + 1) as pageNum (pageNum)}
							{#if pageNum === 1 || pageNum === totalPages || (pageNum >= currentPage - 2 && pageNum <= currentPage + 2)}
								<button
									type="button"
									onclick={() => goToPage(pageNum)}
									aria-current={pageNum === currentPage ? 'page' : undefined}
									class="min-h-11 min-w-11 px-4 py-2 border rounded-md transition-colors tabular-nums"
									class:bg-blue-600={pageNum === currentPage}
									class:text-white={pageNum === currentPage}
									class:border-blue-600={pageNum === currentPage}
									class:border-gray-300={pageNum !== currentPage}
									class:hover:bg-gray-50={pageNum !== currentPage}
								>
									{pageNum}
								</button>
							{:else if pageNum === currentPage - 3 || pageNum === currentPage + 3}
								<span class="px-2" aria-hidden="true">...</span>
							{/if}
						{/each}

						<button
							type="button"
							onclick={() => goToPage(currentPage + 1)}
							disabled={currentPage === totalPages}
							class="min-h-11 px-4 py-2 border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
						>
							Вперёд
						</button>
					</nav>
				{/if}
			{/if}
		</div>
	</div>
</div>
