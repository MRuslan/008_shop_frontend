<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { productsApi } from '$lib/api/products';
	import type { Product, Category } from '$lib/types/product';
	import { formatPrice } from '$lib/utils/format';
	import { storeSettings } from '$lib/stores/store';
	import ProductForm from '$lib/components/admin/ProductForm.svelte';

	interface Props {
		data: {
			products: Product[];
			total: number;
			page: number;
			limit: number;
			categories: Category[];
		};
	}

	let { data }: Props = $props();

	let showProductForm = $state(false);
	let editingProduct = $state<Product | null>(null);
	let searchQuery = $state('');
	let selectedCategoryId = $state<number | null>(null);

	async function handleDelete(productId: number) {
		if (!confirm('Удалить товар? Это действие нельзя отменить.')) return;

		try {
			await productsApi.deleteProduct(productId);
			// Перезагружаем страницу
			window.location.reload();
		} catch (error: any) {
			alert(error.message || 'Ошибка удаления товара');
		}
	}

	function handleEdit(product: Product) {
		editingProduct = product;
		showProductForm = true;
	}

	function handleCreate() {
		editingProduct = null;
		showProductForm = true;
	}

	function handleFormClose() {
		showProductForm = false;
		editingProduct = null;
	}

	function handleFormSuccess() {
		handleFormClose();
		window.location.reload();
	}
</script>

<svelte:head>
	<title>Управление товарами - Админ-панель</title>
</svelte:head>

<div class="bg-white rounded-lg shadow-md p-6">
	<div class="flex items-center justify-between mb-6">
		<h1 class="text-2xl font-bold text-gray-800">Управление товарами</h1>
		<button
			onclick={handleCreate}
			class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
		>
			+ Добавить товар
		</button>
	</div>

	<!-- Фильтры -->
	<div class="mb-6 flex space-x-4">
		<input
			type="text"
			bind:value={searchQuery}
			placeholder="Поиск товаров..."
			class="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
		/>
		<select
			bind:value={selectedCategoryId}
			class="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
		>
			<option value={null}>Все категории</option>
			{#each data.categories as category}
				<option value={category.id}>{category.name}</option>
				{#if category.children}
					{#each category.children as child}
						<option value={child.id}>— {child.name}</option>
					{/each}
				{/if}
			{/each}
		</select>
		<button
			onclick={() => {
				const params = new URLSearchParams();
				if (searchQuery) params.set('search', searchQuery);
				if (selectedCategoryId) params.set('categoryId', selectedCategoryId.toString());
				goto(`/admin/products?${params.toString()}`);
			}}
			class="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
		>
			Применить
		</button>
	</div>

	<!-- Форма товара -->
	{#if showProductForm}
		<div class="mb-6">
			<ProductForm
				product={editingProduct}
				categories={data.categories}
				onSuccess={handleFormSuccess}
				onCancel={handleFormClose}
			/>
		</div>
	{/if}

	<!-- Таблица товаров -->
	<div class="overflow-x-auto">
		<table class="min-w-full divide-y divide-gray-200">
			<thead class="bg-gray-50">
				<tr>
					<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
						Товар
					</th>
					<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
						Категория
					</th>
					<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
						Цена
					</th>
					<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
						Остаток
					</th>
					<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
						Статус
					</th>
					<th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
						Действия
					</th>
				</tr>
			</thead>
			<tbody class="bg-white divide-y divide-gray-200">
				{#each data.products as product}
					<tr class="hover:bg-gray-50">
						<td class="px-6 py-4 whitespace-nowrap">
							<div class="flex items-center">
								{#if product.images && product.images.length > 0}
									<img
										class="h-10 w-10 rounded object-cover mr-3"
										src={product.images[0].url}
										alt={product.name}
									/>
								{:else}
									<div class="h-10 w-10 bg-gray-200 rounded mr-3"></div>
								{/if}
								<div>
									<div class="text-sm font-medium text-gray-900">{product.name}</div>
									<div class="text-sm text-gray-500">{product.sku || '—'}</div>
								</div>
							</div>
						</td>
						<td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
							{product.category?.name || '—'}
						</td>
						<td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
							{formatPrice(product.price, $storeSettings?.currency || 'RUB')}
						</td>
						<td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
							{product.quantity}
						</td>
						<td class="px-6 py-4 whitespace-nowrap">
							<span
								class="px-2 py-1 text-xs font-medium rounded-full"
								class:bg-green-100={product.isActive}
								class:text-green-800={product.isActive}
								class:bg-red-100={!product.isActive}
								class:text-red-800={!product.isActive}
							>
								{product.isActive ? 'Активен' : 'Неактивен'}
							</span>
						</td>
						<td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
							<div class="flex justify-end space-x-2">
								<a
									href="/products/{product.slug}"
									target="_blank"
									class="text-blue-600 hover:text-blue-900"
									title="Просмотр"
								>
									👁️
								</a>
								<button
									onclick={() => handleEdit(product)}
									class="text-indigo-600 hover:text-indigo-900"
									title="Редактировать"
								>
									✏️
								</button>
								<button
									onclick={() => handleDelete(product.id)}
									class="text-red-600 hover:text-red-900"
									title="Удалить"
								>
									🗑️
								</button>
							</div>
						</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>

	<!-- Пагинация -->
	{#if Math.ceil(data.total / data.limit) > 1}
		<div class="mt-6 flex justify-center">
			<p class="text-sm text-gray-600">
				Страница {data.page} из {Math.ceil(data.total / data.limit)} • Всего товаров: {data.total}
			</p>
		</div>
	{/if}
</div>
