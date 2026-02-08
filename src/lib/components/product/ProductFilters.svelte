<script lang="ts">
	import type { Category, ProductFilters } from '$lib/types/product';
	import { categoriesApi } from '$lib/api/categories';
	import { onMount } from 'svelte';

	interface Props {
		filters: ProductFilters;
		onFiltersChange: (filters: ProductFilters) => void;
	}

	let { filters, onFiltersChange }: Props = $props();

	let categories = $state<Category[]>([]);
	let showFilters = $state(false);

	onMount(async () => {
		try {
			categories = await categoriesApi.getCategories({ tree: true, isActive: true });
		} catch (error) {
			console.error('Failed to load categories:', error);
		}
	});

	function updateFilter<K extends keyof ProductFilters>(key: K, value: ProductFilters[K]) {
		onFiltersChange({ ...filters, [key]: value, page: 1 });
	}

	function clearFilters() {
		onFiltersChange({
			search: undefined,
			categoryId: undefined,
			minPrice: undefined,
			maxPrice: undefined,
			inStock: undefined,
			isActive: true,
			sortBy: 'createAt',
			sortOrder: 'DESC',
			page: 1,
			limit: 20
		});
	}

	// Рекурсивная функция для получения всех категорий (включая дочерние)
	function getAllCategoryIds(category: Category): number[] {
		const ids = [category.id];
		if (category.children) {
			category.children.forEach((child) => {
				ids.push(...getAllCategoryIds(child));
			});
		}
		return ids;
	}
</script>

<div class="bg-white rounded-lg shadow-md p-4 mb-6">
	<!-- Кнопка показа/скрытия фильтров (для мобильных) -->
	<button
		onclick={() => showFilters = !showFilters}
		class="md:hidden w-full flex items-center justify-between mb-4 p-2 bg-gray-100 rounded"
	>
		<span class="font-medium">Фильтры</span>
		<svg
			class="w-5 h-5 transition-transform"
			class:rotate-180={showFilters}
			fill="none"
			stroke="currentColor"
			viewBox="0 0 24 24"
		>
			<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
		</svg>
	</button>

	<div class:hidden={!showFilters} class="md:block space-y-4">
		<!-- Поиск -->
		<div>
			<label for="search" class="block text-sm font-medium text-gray-700 mb-1">
				Поиск
			</label>
			<input
				id="search"
				type="text"
				value={filters.search || ''}
				oninput={(e) => updateFilter('search', e.currentTarget.value || undefined)}
				placeholder="Название товара..."
				class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
			/>
		</div>

		<!-- Категория -->
		<div>
			<label for="category" class="block text-sm font-medium text-gray-700 mb-1">
				Категория
			</label>
			<select
				id="category"
				value={filters.categoryId?.toString() || ''}
				onchange={(e) => {
					const value = e.currentTarget.value;
					updateFilter('categoryId', value ? parseInt(value) : undefined);
				}}
				class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
			>
				<option value="">Все категории</option>
				{#each categories as category}
					<option value={category.id}>{category.name}</option>
					{#if category.children}
						{#each category.children as child}
							<option value={child.id}>— {child.name}</option>
						{/each}
					{/if}
				{/each}
			</select>
		</div>

		<!-- Цена -->
		<div class="grid grid-cols-2 gap-2">
			<div>
				<label for="minPrice" class="block text-sm font-medium text-gray-700 mb-1">
					Мин. цена
				</label>
				<input
					id="minPrice"
					type="number"
					value={filters.minPrice || ''}
					oninput={(e) => {
						const value = e.currentTarget.value;
						updateFilter('minPrice', value ? parseFloat(value) : undefined);
					}}
					placeholder="0"
					min="0"
					class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
				/>
			</div>
			<div>
				<label for="maxPrice" class="block text-sm font-medium text-gray-700 mb-1">
					Макс. цена
				</label>
				<input
					id="maxPrice"
					type="number"
					value={filters.maxPrice || ''}
					oninput={(e) => {
						const value = e.currentTarget.value;
						updateFilter('maxPrice', value ? parseFloat(value) : undefined);
					}}
					placeholder="∞"
					min="0"
					class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
				/>
			</div>
		</div>

		<!-- Наличие -->
		<div>
			<label class="flex items-center space-x-2">
				<input
					type="checkbox"
					checked={filters.inStock || false}
					onchange={(e) => updateFilter('inStock', e.currentTarget.checked || undefined)}
					class="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
				/>
				<span class="text-sm text-gray-700">Только в наличии</span>
			</label>
		</div>

		<!-- Сортировка -->
		<div>
			<label for="sortBy" class="block text-sm font-medium text-gray-700 mb-1">
				Сортировка
			</label>
			<select
				id="sortBy"
				value={`${filters.sortBy || 'createAt'}-${filters.sortOrder || 'DESC'}`}
				onchange={(e) => {
					const [sortBy, sortOrder] = e.currentTarget.value.split('-');
					updateFilter('sortBy', sortBy as 'price' | 'createAt' | 'name');
					updateFilter('sortOrder', sortOrder as 'ASC' | 'DESC');
				}}
				class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
			>
				<option value="createAt-DESC">Новинки</option>
				<option value="price-ASC">Цена: по возрастанию</option>
				<option value="price-DESC">Цена: по убыванию</option>
				<option value="name-ASC">Название: А-Я</option>
				<option value="name-DESC">Название: Я-А</option>
			</select>
		</div>

		<!-- Кнопка сброса -->
		<button
			onclick={clearFilters}
			class="w-full px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
		>
			Сбросить фильтры
		</button>
	</div>
</div>
