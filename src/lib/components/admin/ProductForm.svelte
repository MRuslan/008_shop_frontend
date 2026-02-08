<script lang="ts">
	import { productsApi } from '$lib/api/products';
	import type { Product, Category } from '$lib/types/product';

	interface Props {
		product?: Product | null;
		categories: Category[];
		onSuccess: () => void;
		onCancel: () => void;
	}

	let { product, categories, onSuccess, onCancel }: Props = $props();

	let name = $state(product?.name || '');
	let slug = $state(product?.slug || '');
	let description = $state(product?.description || '');
	let price = $state(product?.price ? parseFloat(product.price) : 0);
	let compareAtPrice = $state(product?.compareAtPrice ? parseFloat(product.compareAtPrice) : 0);
	let sku = $state(product?.sku || '');
	let quantity = $state(product?.quantity || 0);
	let categoryId = $state(product?.categoryId || null);
	let isActive = $state(product?.isActive ?? true);
	let images = $state<Array<{ url: string; sortOrder?: number }>>(product?.images || []);
	
	let isSubmitting = $state(false);
	let error = $state<string | null>(null);

	function addImage() {
		const url = prompt('Введите URL изображения:');
		if (url && url.trim()) {
			images = [...images, { url: url.trim(), sortOrder: images.length }];
		}
	}

	function removeImage(index: number) {
		images = images.filter((_, i) => i !== index);
	}

	async function handleSubmit() {
		error = null;

		if (!name.trim()) {
			error = 'Название товара обязательно';
			return;
		}

		if (price < 0) {
			error = 'Цена не может быть отрицательной';
			return;
		}

		isSubmitting = true;

		try {
			const data: any = {
				name: name.trim(),
				slug: slug.trim() || undefined,
				description: description.trim() || undefined,
				price,
				compareAtPrice: compareAtPrice > 0 ? compareAtPrice : undefined,
				sku: sku.trim() || undefined,
				quantity,
				categoryId: categoryId || undefined,
				isActive,
				images: images.length > 0 ? images : undefined
			};

			if (product) {
				await productsApi.updateProduct(product.id, data);
			} else {
				await productsApi.createProduct(data);
			}

			onSuccess();
		} catch (err: any) {
			const message = err.message || 'Ошибка сохранения товара';
			if (Array.isArray(message)) {
				error = message.join(', ');
			} else {
				error = message;
			}
		} finally {
			isSubmitting = false;
		}
	}
</script>

<div class="bg-gray-50 rounded-lg p-6 border-2 border-blue-500">
	<h2 class="text-xl font-semibold text-gray-800 mb-4">
		{product ? 'Редактирование товара' : 'Создание товара'}
	</h2>

	<form onsubmit={(e) => { e.preventDefault(); handleSubmit(); }} class="space-y-4">
		{#if error}
			<div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
				{error}
			</div>
		{/if}

		<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
			<div>
				<label class="block text-sm font-medium text-gray-700 mb-1">
					Название <span class="text-red-500">*</span>
				</label>
				<input
					type="text"
					bind:value={name}
					required
					class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
				/>
			</div>

			<div>
				<label class="block text-sm font-medium text-gray-700 mb-1">Slug</label>
				<input
					type="text"
					bind:value={slug}
					placeholder="Автоматически из названия"
					class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
				/>
			</div>
		</div>

		<div>
			<label class="block text-sm font-medium text-gray-700 mb-1">Описание</label>
			<textarea
				bind:value={description}
				rows="4"
				class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
			></textarea>
		</div>

		<div class="grid grid-cols-1 md:grid-cols-3 gap-4">
			<div>
				<label class="block text-sm font-medium text-gray-700 mb-1">
					Цена <span class="text-red-500">*</span>
				</label>
				<input
					type="number"
					bind:value={price}
					min="0"
					step="0.01"
					required
					class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
				/>
			</div>

			<div>
				<label class="block text-sm font-medium text-gray-700 mb-1">Старая цена</label>
				<input
					type="number"
					bind:value={compareAtPrice}
					min="0"
					step="0.01"
					class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
				/>
			</div>

			<div>
				<label class="block text-sm font-medium text-gray-700 mb-1">Артикул</label>
				<input
					type="text"
					bind:value={sku}
					class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
				/>
			</div>
		</div>

		<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
			<div>
				<label class="block text-sm font-medium text-gray-700 mb-1">Количество</label>
				<input
					type="number"
					bind:value={quantity}
					min="0"
					class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
				/>
			</div>

			<div>
				<label class="block text-sm font-medium text-gray-700 mb-1">Категория</label>
				<select
					bind:value={categoryId}
					class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
				>
					<option value={null}>Без категории</option>
					{#each categories as category}
						<option value={category.id}>{category.name}</option>
						{#if category.children && category.children.length > 0}
							{#each category.children as child}
								<option value={child.id}>— {child.name}</option>
							{/each}
						{/if}
					{/each}
				</select>
				<p class="text-xs text-gray-500 mt-1">
					Выберите категорию для товара или оставьте "Без категории"
				</p>
			</div>
		</div>

		<div>
			<label class="flex items-center space-x-2">
				<input
					type="checkbox"
					bind:checked={isActive}
					class="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
				/>
				<span class="text-sm text-gray-700">Товар активен</span>
			</label>
		</div>

		<!-- Изображения -->
		<div>
			<label class="block text-sm font-medium text-gray-700 mb-2">Изображения</label>
			<div class="space-y-2">
				{#each images as image, index}
					<div class="flex items-center space-x-2">
						<input
							type="text"
							bind:value={image.url}
							placeholder="URL изображения"
							class="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
						/>
						<input
							type="number"
							bind:value={image.sortOrder}
							placeholder="Порядок"
							class="w-20 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
						/>
						<button
							type="button"
							onclick={() => removeImage(index)}
							class="px-3 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
						>
							Удалить
						</button>
					</div>
				{/each}
				<button
					type="button"
					onclick={addImage}
					class="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
				>
					+ Добавить изображение
				</button>
			</div>
		</div>

		<div class="flex space-x-2 pt-4">
			<button
				type="submit"
				disabled={isSubmitting}
				class="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
			>
				{isSubmitting ? 'Сохранение...' : 'Сохранить'}
			</button>
			<button
				type="button"
				onclick={onCancel}
				class="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
			>
				Отмена
			</button>
		</div>
	</form>
</div>
