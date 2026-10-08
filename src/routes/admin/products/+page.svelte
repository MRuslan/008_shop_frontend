<script lang="ts">
	import Plus from '@lucide/svelte/icons/plus';
	import ActiveBadge from '$lib/components/ui/ActiveBadge.svelte';
	import { goto, invalidateAll } from '$app/navigation';
	import { productsApi } from '$lib/api/products';
	import type { Product, Category } from '$lib/types/product';
	import { formatPrice } from '$lib/utils/format';
	import { storeSettings } from '$lib/stores/store';
	import ProductForm from '$lib/components/admin/ProductForm.svelte';
	import { getErrorMessage } from '$lib/utils/errors';
	import { toast } from '$lib/stores/toast';
	import { confirmDialog } from '$lib/stores/confirm';
	import Eye from '@lucide/svelte/icons/eye';
	import Pencil from '@lucide/svelte/icons/pencil';
	import Trash2 from '@lucide/svelte/icons/trash-2';
	import Pagination from '$lib/components/catalog/Pagination.svelte';
	import { page } from '$app/state';

	// Ссылка на страницу списка с теми же поиском и категорией
	function pageHref(pageNumber: number): string {
		const params = new URLSearchParams(page.url.searchParams);
		if (pageNumber > 1) params.set('page', String(pageNumber));
		else params.delete('page');
		const query = params.toString();
		return query ? `/admin/products?${query}` : '/admin/products';
	}

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

<div class="rounded-2xl bg-surface p-5 md:p-6">
	<div class="flex items-center justify-between mb-6">
		<h1 class="text-headline text-ink">Управление товарами</h1>
		<button
			onclick={handleCreate}
			class="btn-primary"
		>
			<Plus class="size-4" aria-hidden="true" />
			Добавить товар
		</button>
	</div>

	<!-- Фильтры -->
	<div class="mb-6 flex flex-wrap gap-3">
		<input
			type="search"
			bind:value={searchQuery}
			placeholder="Поиск товаров..."
			aria-label="Поиск товаров"
			class="flex-1 min-w-[12rem] field"
		/>
		<select
			bind:value={selectedCategoryId}
			aria-label="Категория"
			class="field"
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
			class="btn-secondary"
		>
			Применить
		</button>
	</div>

	<!-- Форма товара -->
	{#if showProductForm}
		<div class="mb-6">
			<!-- Другой товар — новая форма: поля заполняются из пропсов только при создании -->
			{#key editingProduct?.id ?? "new"}
				<ProductForm
					product={editingProduct}
					categories={data.categories}
					onSuccess={handleFormSuccess}
					onCancel={handleFormClose}
				/>
			{/key}
		</div>
	{/if}

	<!-- Таблица товаров -->
	{#if data.products && data.products.length > 0}
		<div class="overflow-x-auto">
			<table class="min-w-full divide-y divide-line text-left">
				<thead class="bg-gray-50">
					<tr>
						<th class="text-left font-medium text-gray-500 px-4 py-3 text-label">
							Товар
						</th>
						<th class="text-left font-medium text-gray-500 px-4 py-3 text-label">
							Категория
						</th>
						<th class="text-left font-medium text-gray-500 px-4 py-3 text-label">
							Цена
						</th>
						<th class="text-left font-medium text-gray-500 px-4 py-3 text-label">
							Остаток
						</th>
						<th class="text-left font-medium text-gray-500 px-4 py-3 text-label">
							Статус
						</th>
						<th class="text-right font-medium text-gray-500 px-4 py-3 text-label">
							Действия
						</th>
					</tr>
				</thead>
				<tbody class="divide-y divide-line">
					{#each data.products as product}
						<tr class="hover:bg-gray-50">
							<td class="whitespace-nowrap px-4 py-3">
								<div class="flex items-center">
									{#if product.images && product.images.length > 0}
										<img
											class="mr-3 size-10 rounded-lg bg-gray-50 object-contain mix-blend-multiply"
											src={product.images[0].url}
											alt={product.name}
										/>
									{:else}
										<div class="mr-3 size-10 rounded-lg bg-gray-100"></div>
									{/if}
									<div>
										<div class="text-body-sm font-medium text-gray-900">{product.name}</div>
										<div class="text-body-sm text-gray-500">{product.sku || '—'}</div>
									</div>
								</div>
							</td>
							<td class="whitespace-nowrap text-body-sm text-gray-500 px-4 py-3">
								{product.category?.name || '—'}
							</td>
							<td class="whitespace-nowrap text-body-sm text-gray-900 px-4 py-3">
								{formatPrice(product.price, $storeSettings?.currency || 'RUB')}
							</td>
							<td class="whitespace-nowrap text-body-sm text-gray-500 px-4 py-3">
								{product.quantity}
							</td>
							<td class="whitespace-nowrap px-4 py-3">
								<ActiveBadge active={product.isActive} on="Активен" off="Неактивен" />
							</td>
							<td class="whitespace-nowrap text-right text-body-sm font-medium px-4 py-3">
								<div class="flex justify-end gap-1">
									<a
										href="/products/{product.slug}"
										target="_blank"
										class="inline-flex size-11 items-center justify-center rounded-xl text-gray-600 transition-colors hover:bg-gray-100 hover:text-ink"
										title="Открыть на витрине"
										aria-label="Открыть «{product.name}» на витрине"
									>
										<Eye class="size-4.5" aria-hidden="true" />
									</a>
									<button
										onclick={() => handleEdit(product)}
										class="inline-flex size-11 items-center justify-center rounded-xl text-gray-600 transition-colors hover:bg-gray-100 hover:text-ink"
										title="Редактировать"
										aria-label="Редактировать «{product.name}»"
									>
										<Pencil class="size-4.5" aria-hidden="true" />
									</button>
									<button
										onclick={() => handleDelete(product)}
										class="inline-flex size-11 items-center justify-center rounded-xl text-gray-600 transition-colors hover:bg-negative/8 hover:text-negative"
										title="Удалить"
										aria-label="Удалить «{product.name}»"
									>
										<Trash2 class="size-4.5" aria-hidden="true" />
									</button>
								</div>
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>

		<!-- Пагинация -->
		<Pagination
			current={data.page}
			total={Math.max(1, Math.ceil(data.total / data.limit))}
			href={pageHref}
			label="Страницы товаров"
		/>
		<p class="mt-3 text-center text-body-sm text-gray-600">Всего товаров: {data.total}</p>
	{:else}
		<div class="text-center py-12">
			<p class="mb-4 text-body text-gray-600">Товары не найдены</p>
			<button
				onclick={handleCreate}
				class="btn-primary"
			>
				<Plus class="size-4" aria-hidden="true" />
				Добавить первый товар
			</button>
		</div>
	{/if}
</div>
