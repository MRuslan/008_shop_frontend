<script lang="ts">
	import { productsApi } from '$lib/api/products';
	import type { Product, Category, ProductImage } from '$lib/types/product';
	import { getErrorMessage } from '$lib/utils/errors';

	interface Props {
		product?: Product | null;
		categories: Category[];
		onSuccess: () => void;
		onCancel: () => void;
	}

	let { product, categories, onSuccess, onCancel }: Props = $props();

	const formId = $props.id();

	let name = $state(product?.name || '');
	let slug = $state(product?.slug || '');
	let description = $state(product?.description || '');
	let price = $state(product?.price ? parseFloat(product.price) : 0);
	let compareAtPrice = $state(product?.compareAtPrice ? parseFloat(product.compareAtPrice) : 0);
	let sku = $state(product?.sku || '');
	let quantity = $state(product?.quantity || 0);
	let categoryId = $state(product?.categoryId || null);
	let isActive = $state(product?.isActive ?? true);
	let images = $state<ProductImage[]>(product?.images?.map((img) => ({ ...img })) || []);

	// Добавление изображения: инлайн-поле вместо prompt()
	let newImageUrl = $state('');
	let imageError = $state<string | null>(null);

	let isSubmitting = $state(false);
	let error = $state<string | null>(null);

	function isValidImageUrl(value: string): boolean {
		try {
			const url = new URL(value);
			return url.protocol === 'https:' || url.protocol === 'http:';
		} catch {
			return false;
		}
	}

	function addImage() {
		const url = newImageUrl.trim();
		imageError = null;

		if (!url) {
			imageError = 'Вставьте ссылку на изображение';
			return;
		}
		if (!isValidImageUrl(url)) {
			imageError = 'Ссылка должна начинаться с http:// или https://';
			return;
		}
		if (images.some((img) => img.url === url)) {
			imageError = 'Это изображение уже добавлено';
			return;
		}

		images = [...images, { url, sortOrder: images.length }];
		newImageUrl = '';
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

		if (!Number.isFinite(price) || price < 0) {
			error = 'Цена не может быть отрицательной';
			return;
		}

		if (compareAtPrice > 0 && compareAtPrice <= price) {
			error = 'Старая цена должна быть больше текущей, иначе скидка не имеет смысла';
			return;
		}

		isSubmitting = true;

		try {
			// Бэкенд принимает цены числами, а отдаёт строками, поэтому тип Product здесь не подходит буквально
			const payload = {
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
			} as unknown as Partial<Product>;

			if (product) {
				await productsApi.updateProduct(product.id, payload);
			} else {
				await productsApi.createProduct(payload);
			}

			onSuccess();
		} catch (err) {
			error = getErrorMessage(err, 'Не удалось сохранить товар');
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
			<div role="alert" class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
				{error}
			</div>
		{/if}

		<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
			<div>
				<label for="{formId}-name" class="block text-sm font-medium text-gray-700 mb-1">
					Название <span class="text-red-500" aria-hidden="true">*</span>
				</label>
				<input
					id="{formId}-name"
					type="text"
					bind:value={name}
					required
					maxlength="255"
					class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
				/>
			</div>

			<div>
				<label for="{formId}-slug" class="block text-sm font-medium text-gray-700 mb-1">Slug</label>
				<input
					id="{formId}-slug"
					type="text"
					bind:value={slug}
					placeholder="Автоматически из названия"
					class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
				/>
			</div>
		</div>

		<div>
			<label for="{formId}-description" class="block text-sm font-medium text-gray-700 mb-1">Описание</label>
			<textarea
				id="{formId}-description"
				bind:value={description}
				rows="4"
				class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
			></textarea>
		</div>

		<div class="grid grid-cols-1 md:grid-cols-3 gap-4">
			<div>
				<label for="{formId}-price" class="block text-sm font-medium text-gray-700 mb-1">
					Цена <span class="text-red-500" aria-hidden="true">*</span>
				</label>
				<input
					id="{formId}-price"
					type="number"
					bind:value={price}
					min="0"
					step="0.01"
					required
					class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
				/>
			</div>

			<div>
				<label for="{formId}-compare-price" class="block text-sm font-medium text-gray-700 mb-1">Старая цена</label>
				<input
					id="{formId}-compare-price"
					type="number"
					bind:value={compareAtPrice}
					min="0"
					step="0.01"
					class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
				/>
			</div>

			<div>
				<label for="{formId}-sku" class="block text-sm font-medium text-gray-700 mb-1">Артикул</label>
				<input
					id="{formId}-sku"
					type="text"
					bind:value={sku}
					class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
				/>
			</div>
		</div>

		<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
			<div>
				<label for="{formId}-quantity" class="block text-sm font-medium text-gray-700 mb-1">Количество</label>
				<input
					id="{formId}-quantity"
					type="number"
					bind:value={quantity}
					min="0"
					step="1"
					class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
				/>
			</div>

			<div>
				<label for="{formId}-category" class="block text-sm font-medium text-gray-700 mb-1">Категория</label>
				<select
					id="{formId}-category"
					bind:value={categoryId}
					class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
				>
					<option value={null}>Без категории</option>
					{#each categories as category (category.id)}
						<option value={category.id}>{category.name}</option>
						{#if category.children && category.children.length > 0}
							{#each category.children as child (child.id)}
								<option value={child.id}>— {child.name}</option>
							{/each}
						{/if}
					{/each}
				</select>
				<p class="text-xs text-gray-500 mt-1">
					Выберите категорию для товара или оставьте «Без категории»
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
		<fieldset class="m-0 min-w-0 border-0 p-0">
			<legend class="block text-sm font-medium text-gray-700 mb-2">Изображения</legend>
			<div class="space-y-2">
				{#each images as image, index (image.url)}
					<div class="flex flex-wrap items-center gap-2">
						<img
							src={image.url}
							alt=""
							class="h-10 w-10 shrink-0 rounded object-cover bg-gray-200"
							loading="lazy"
						/>
						<input
							type="url"
							bind:value={image.url}
							aria-label="Ссылка на изображение {index + 1}"
							class="flex-1 min-w-0 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
						/>
						<input
							type="number"
							bind:value={image.sortOrder}
							aria-label="Порядок изображения {index + 1}"
							placeholder="Порядок"
							class="w-24 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
						/>
						<button
							type="button"
							onclick={() => removeImage(index)}
							class="px-3 py-2 border border-gray-300 text-red-600 rounded-md hover:bg-red-50 transition-colors"
						>
							Удалить
						</button>
					</div>
				{/each}

				<div class="flex flex-wrap items-start gap-2 pt-1">
					<div class="flex-1 min-w-[12rem]">
						<label for="{formId}-new-image" class="sr-only">Ссылка на новое изображение</label>
						<input
							id="{formId}-new-image"
							type="url"
							bind:value={newImageUrl}
							placeholder="https://example.com/photo.jpg"
							aria-invalid={imageError ? 'true' : undefined}
							aria-describedby={imageError ? `${formId}-image-error` : undefined}
							onkeydown={(e) => {
								if (e.key === 'Enter') {
									e.preventDefault();
									addImage();
								}
							}}
							class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
						/>
						{#if imageError}
							<p id="{formId}-image-error" class="mt-1 text-sm text-red-600" role="alert">{imageError}</p>
						{/if}
					</div>
					<button
						type="button"
						onclick={addImage}
						class="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
					>
						+ Добавить изображение
					</button>
				</div>
			</div>
		</fieldset>

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
