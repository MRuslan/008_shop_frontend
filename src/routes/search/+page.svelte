<script lang="ts">
	import ProductList from '$lib/components/product/ProductList.svelte';
	import type { Product, ProductFilters } from '$lib/types/product';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';

	interface Props {
		data: {
			query: string;
			products: Product[];
			total: number;
			page: number;
			limit: number;
			filters: ProductFilters;
		};
	}

	let { data }: Props = $props();

	let searchQuery = $state(data.query);
	let currentPage = $state(data.page);
	let sortBy = $state(data.filters.sortBy || 'createAt');
	let sortOrder = $state(data.filters.sortOrder || 'DESC');

	function handleSearch() {
		const params = new URLSearchParams();
		if (searchQuery.trim()) {
			params.set('q', searchQuery.trim());
		}
		if (sortBy !== 'createAt') params.set('sortBy', sortBy);
		if (sortOrder !== 'DESC') params.set('sortOrder', sortOrder);

		const query = params.toString();
		goto(`/search${query ? `?${query}` : ''}`, { noScroll: false });
	}

	function updateSorting(newSortBy: 'price' | 'createAt' | 'name', newSortOrder: 'ASC' | 'DESC') {
		sortBy = newSortBy;
		sortOrder = newSortOrder;
		currentPage = 1;
		handleSearch();
	}

	function goToPage(newPage: number) {
		currentPage = newPage;
		const params = new URLSearchParams();
		if (searchQuery.trim()) {
			params.set('q', searchQuery.trim());
		}
		if (currentPage > 1) params.set('page', currentPage.toString());
		if (sortBy !== 'createAt') params.set('sortBy', sortBy);
		if (sortOrder !== 'DESC') params.set('sortOrder', sortOrder);

		const query = params.toString();
		goto(`/search${query ? `?${query}` : ''}`, { noScroll: false });
	}

	const totalPages = Math.ceil(data.total / data.limit);
</script>

<svelte:head>
	<title>Поиск {data.query ? `"${data.query}"` : ''} - Каталог</title>
	<meta name="description" content="Результаты поиска товаров" />
</svelte:head>

<div class="container mx-auto px-4 py-8">
	<h1 class="text-3xl font-bold text-gray-800 mb-6">Поиск товаров</h1>

	<!-- Поисковая форма -->
	<form
		onsubmit={(e) => {
			e.preventDefault();
			handleSearch();
		}}
		class="mb-6"
	>
		<div class="flex gap-2">
			<input
				type="text"
				bind:value={searchQuery}
				placeholder="Введите название товара..."
				class="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
			/>
			<button
				type="submit"
				class="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
			>
				Найти
			</button>
		</div>
	</form>

	{#if data.query}
		<!-- Результаты поиска -->
		<div class="mb-4 flex items-center justify-between">
			<div class="text-sm text-gray-600">
				Найдено товаров: {data.total}
				{#if data.query}
					по запросу "<span class="font-medium">{data.query}</span>"
				{/if}
			</div>
			<div class="flex items-center space-x-2">
				<label for="sort" class="text-sm text-gray-700">Сортировка:</label>
				<select
					id="sort"
					value={`${sortBy}-${sortOrder}`}
					onchange={(e) => {
						const [newSortBy, newSortOrder] = e.currentTarget.value.split('-');
						updateSorting(
							newSortBy as 'price' | 'createAt' | 'name',
							newSortOrder as 'ASC' | 'DESC'
						);
					}}
					class="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
				>
					<option value="createAt-DESC">Новинки</option>
					<option value="price-ASC">Цена: по возрастанию</option>
					<option value="price-DESC">Цена: по убыванию</option>
					<option value="name-ASC">Название: А-Я</option>
					<option value="name-DESC">Название: Я-А</option>
				</select>
			</div>
		</div>

		{#if data.products.length === 0}
			<div class="text-center py-12">
				<p class="text-gray-500 text-lg mb-2">Товары не найдены</p>
				<p class="text-gray-400 text-sm">Попробуйте изменить поисковый запрос</p>
			</div>
		{:else}
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
		{/if}
	{:else}
		<div class="text-center py-12">
			<p class="text-gray-500 text-lg">Введите поисковый запрос для начала поиска</p>
		</div>
	{/if}
</div>
