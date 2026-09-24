<script lang="ts">
	import { goto, invalidateAll } from '$app/navigation';
	import ProductList from '$lib/components/product/ProductList.svelte';
	import type { Product, ProductFilters } from '$lib/types/product';

	type SortBy = 'price' | 'createAt' | 'name';
	type SortOrder = 'ASC' | 'DESC';

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

	// Writable derived: поле ввода редактируется локально, но подхватывает запрос из URL при навигации
	let searchQuery = $derived(data.query);

	const currentPage = $derived(data.page);
	const totalPages = $derived(Math.max(1, Math.ceil(data.total / data.limit)));
	const sortBy = $derived((data.filters.sortBy || 'createAt') as SortBy);
	const sortOrder = $derived((data.filters.sortOrder || 'DESC') as SortOrder);

	function buildUrl(query: string, pageNumber: number, by: SortBy, order: SortOrder): string {
		const params = new URLSearchParams();
		if (query.trim()) params.set('q', query.trim());
		if (pageNumber > 1) params.set('page', pageNumber.toString());
		if (by !== 'createAt') params.set('sortBy', by);
		if (order !== 'DESC') params.set('sortOrder', order);
		const search = params.toString();
		return `/search${search ? `?${search}` : ''}`;
	}

	function handleSearch() {
		goto(buildUrl(searchQuery, 1, sortBy, sortOrder), { noScroll: false });
	}

	function updateSorting(value: string) {
		const [by, order] = value.split('-') as [SortBy, SortOrder];
		goto(buildUrl(data.query, 1, by, order), { noScroll: false });
	}

	function goToPage(newPage: number) {
		goto(buildUrl(data.query, newPage, sortBy, sortOrder), { noScroll: false });
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
	<title>{data.query ? `Поиск «${data.query}»` : 'Поиск товаров'} | Каталог</title>
	<meta name="description" content="Результаты поиска товаров" />
	<meta name="robots" content="noindex, follow" />
</svelte:head>

<div class="container mx-auto px-4 py-8">
	<h1 class="text-3xl font-bold text-gray-800 mb-6">Поиск товаров</h1>

	<!-- Поисковая форма -->
	<form
		role="search"
		onsubmit={(e) => {
			e.preventDefault();
			handleSearch();
		}}
		class="mb-6"
	>
		<div class="flex gap-2">
			<input
				type="search"
				bind:value={searchQuery}
				placeholder="Введите название товара..."
				aria-label="Поисковый запрос"
				enterkeyhint="search"
				class="flex-1 min-w-0 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
			/>
			<button
				type="submit"
				class="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
			>
				Найти
			</button>
		</div>
	</form>

	{#if data.loadError}
		<div role="alert" class="rounded-lg border border-red-200 bg-red-50 p-6 text-center">
			<p class="font-medium text-red-800">Не удалось выполнить поиск</p>
			<p class="mt-1 text-sm text-red-700">{data.loadError}</p>
			<button
				type="button"
				onclick={retry}
				disabled={retrying}
				class="mt-4 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
			>
				{retrying ? 'Обновляем…' : 'Попробовать снова'}
			</button>
		</div>
	{:else if data.query}
		<!-- Результаты поиска -->
		<div class="mb-4 flex flex-wrap items-center justify-between gap-3">
			<p class="text-sm text-gray-600" role="status">
				Найдено товаров: {data.total} по запросу «<span class="font-medium">{data.query}</span>»
			</p>
			<div class="flex items-center space-x-2">
				<label for="sort" class="text-sm text-gray-700">Сортировка:</label>
				<select
					id="sort"
					value={`${sortBy}-${sortOrder}`}
					onchange={(e) => updateSorting(e.currentTarget.value)}
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
				<p class="text-gray-500 text-sm">Попробуйте изменить поисковый запрос</p>
			</div>
		{:else}
			<ProductList products={data.products} />

			<!-- Пагинация -->
			{#if totalPages > 1}
				<nav class="mt-8 flex justify-center items-center space-x-2" aria-label="Страницы результатов">
					<button
						type="button"
						onclick={() => goToPage(currentPage - 1)}
						disabled={currentPage === 1}
						class="px-4 py-2 border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
					>
						Назад
					</button>

					{#each Array.from({ length: totalPages }, (_, i) => i + 1) as pageNum (pageNum)}
						{#if pageNum === 1 || pageNum === totalPages || (pageNum >= currentPage - 2 && pageNum <= currentPage + 2)}
							<button
								type="button"
								onclick={() => goToPage(pageNum)}
								aria-current={pageNum === currentPage ? 'page' : undefined}
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
							<span class="px-2" aria-hidden="true">...</span>
						{/if}
					{/each}

					<button
						type="button"
						onclick={() => goToPage(currentPage + 1)}
						disabled={currentPage === totalPages}
						class="px-4 py-2 border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
					>
						Вперёд
					</button>
				</nav>
			{/if}
		{/if}
	{:else}
		<div class="text-center py-12">
			<p class="text-gray-500 text-lg">Введите поисковый запрос для начала поиска</p>
		</div>
	{/if}
</div>
