<script lang="ts">
	import ProductList from '$lib/components/product/ProductList.svelte';
	import ProductFilters from '$lib/components/product/ProductFilters.svelte';
	import type { Product, ProductFilters as ProductFiltersType, Category } from '$lib/types/product';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';

	interface Props {
		data: {
			products: Product[];
			total: number;
			page: number;
			limit: number;
			categories: Category[];
			filters: ProductFiltersType;
		};
	}

	let { data }: Props = $props();

	let filters = $state(data.filters);
	let currentPage = $state(data.page);

	function handleFiltersChange(newFilters: ProductFiltersType) {
		filters = newFilters;
		currentPage = 1;
		updateUrl();
	}

	function updateUrl() {
		const params = new URLSearchParams();
		
		if (filters.search) params.set('search', filters.search);
		if (filters.categoryId) params.set('categoryId', filters.categoryId.toString());
		if (filters.minPrice) params.set('minPrice', filters.minPrice.toString());
		if (filters.maxPrice) params.set('maxPrice', filters.maxPrice.toString());
		if (filters.inStock) params.set('inStock', 'true');
		if (filters.sortBy) params.set('sortBy', filters.sortBy);
		if (filters.sortOrder) params.set('sortOrder', filters.sortOrder);
		if (currentPage > 1) params.set('page', currentPage.toString());
		if (filters.limit && filters.limit !== 20) params.set('limit', filters.limit.toString());

		goto(`/catalog?${params.toString()}`, { noScroll: false });
	}

	function goToPage(newPage: number) {
		currentPage = newPage;
		filters = { ...filters, page: newPage };
		updateUrl();
	}

	const totalPages = Math.ceil(data.total / data.limit);
</script>

<svelte:head>
	<title>Каталог товаров</title>
	<meta name="description" content="Каталог товаров нашего магазина" />
</svelte:head>

<div class="container mx-auto px-4 py-8">
	<h1 class="text-3xl font-bold text-gray-800 mb-6">Каталог товаров</h1>

	<div class="grid grid-cols-1 lg:grid-cols-4 gap-6">
		<!-- Фильтры -->
		<aside class="lg:col-span-1">
			<ProductFilters {filters} onFiltersChange={handleFiltersChange} />
		</aside>

		<!-- Товары -->
		<div class="lg:col-span-3">
			<!-- Информация о результатах -->
			<div class="mb-4 text-sm text-gray-600">
				Найдено товаров: {data.total}
			</div>

			<!-- Список товаров -->
			<ProductList products={data.products} />

			<!-- Пагинация -->
			{#if totalPages > 1}
				<div class="mt-8 flex justify-center items-center space-x-2">
					<button
						onclick={() => goToPage(currentPage - 1)}
						disabled={currentPage === 1}
						class="px-4 py-2 border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
					>
						Назад
					</button>

					{#each Array.from({ length: totalPages }, (_, i) => i + 1) as pageNum}
						{#if pageNum === 1 || pageNum === totalPages || (pageNum >= currentPage - 2 && pageNum <= currentPage + 2)}
							<button
								onclick={() => goToPage(pageNum)}
								class="px-4 py-2 border rounded-md transition-colors"
								class:bg-blue-600={pageNum === currentPage}
								class:text-white={pageNum === currentPage}
								class:border-blue-600={pageNum === currentPage}
								class:border-gray-300={pageNum !== currentPage}
								class:hover:bg-gray-50={pageNum !== currentPage}
							>
								{pageNum}
							</button>
						{:else if pageNum === currentPage - 3 || pageNum === currentPage + 3}
							<span class="px-2">...</span>
						{/if}
					{/each}

					<button
						onclick={() => goToPage(currentPage + 1)}
						disabled={currentPage === totalPages}
						class="px-4 py-2 border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
					>
						Вперёд
					</button>
				</div>
			{/if}
		</div>
	</div>
</div>
