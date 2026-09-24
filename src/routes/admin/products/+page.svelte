<script lang="ts">
	import { goto, invalidateAll } from '$app/navigation';
	import { productsApi } from '$lib/api/products';
	import type { Product, Category } from '$lib/types/product';
	import { formatPrice } from '$lib/utils/format';
	import { storeSettings } from '$lib/stores/store';
	import ProductForm from '$lib/components/admin/ProductForm.svelte';
	import { getErrorMessage } from '$lib/utils/errors';
	import { toast } from '$lib/stores/toast';
	import { confirmDialog } from '$lib/stores/confirm';

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
	let selectedCategoryId = $state<string | number>('');

	async function handleDelete(product: Product) {
		const confirmed = await confirmDialog({
			title: `Удалить товар «${product.name}»?`,
			message: 'Товар исчезнет из каталога. Это действие нельзя отменить.',
			confirmLabel: 'Удалить',
			danger: true
		});
		if (!confirmed) return;

		try {
			await productsApi.deleteProduct(product.id);
			await invalidateAll();
			toast.success(`Товар «${product.name}» удалён`);
		} catch (err) {
			toast.error(getErrorMessage(err, 'Не удалось удалить товар'));
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
		invalidateAll();
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
	<div class="mb-6 flex flex-wrap gap-3">
		<input
			type="text"
			bind:value={searchQuery}
			placeholder="Поиск товаров..."
			class="flex-1 min-w-[12rem] min-h-11 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
		/>
		<select
			bind:value={selectedCategoryId}
			class="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
		>
			<option value="">Все товары</option>
			<option value="null">Товары без категорий</option>
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
				if (selectedCategoryId === 'null') {
					params.set('categoryId', 'null');
				} else if (selectedCategoryId && selectedCategoryId !== '') {
					params.set('categoryId', selectedCategoryId.toString());
				}
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
	{#if data.products && data.products.length > 0}
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
										class="inline-flex h-11 w-11 items-center justify-center rounded-md text-blue-600 hover:bg-blue-50 hover:text-blue-900"
										title="Просмотр"
									>
										👁️
									</a>
									<button
										onclick={() => handleEdit(product)}
										class="inline-flex h-11 w-11 items-center justify-center rounded-md text-indigo-600 hover:bg-indigo-50 hover:text-indigo-900"
										title="Редактировать"
									>
										✏️
									</button>
									<button
										onclick={() => handleDelete(product)}
										class="inline-flex h-11 w-11 items-center justify-center rounded-md text-red-600 hover:bg-red-50 hover:text-red-900"
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
	{:else}
		<div class="text-center py-12">
			<p class="text-gray-500 mb-4">Товары не найдены</p>
			<button
				onclick={handleCreate}
				class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
			>
				+ Добавить первый товар
			</button>
		</div>
	{/if}
</div>
