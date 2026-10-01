<script lang="ts">
	import { onMount } from 'svelte';
	import { productsApi } from '$lib/api/products';
	import { locationsApi } from '$lib/api/locations';
	import type { Product, Category, ProductImage } from '$lib/types/product';
	import type { Location } from '$lib/types/order';
	import { getErrorMessage } from '$lib/utils/errors';

	interface Props {
		product?: Product | null;
		categories: Category[];
		onSuccess: () => void;
		onCancel: () => void;
	}

	let { product, categories, onSuccess, onCancel }: Props = $props();

	const formId = $props.id();

	const LOCATION_TYPES: Record<Location['type'], string> = {
		warehouse: 'склад',
		pickup_point: 'пункт выдачи',
		retail: 'магазин'
	};
	const IMAGE_TYPES = 'image/jpeg,image/png,image/webp,image/avif,image/gif';

	let name = $state(product?.name || '');
	let slug = $state(product?.slug || '');
	let description = $state(product?.description || '');
	let price = $state(product?.price ? parseFloat(product.price) : 0);
	let compareAtPrice = $state(product?.compareAtPrice ? parseFloat(product.compareAtPrice) : 0);
	let sku = $state(product?.sku || '');
	let categoryId = $state(product?.categoryId || null);
	let isActive = $state(product?.isActive ?? true);
	let images = $state<ProductImage[]>(product?.images?.map((img) => ({ ...img })) || []);

	// Характеристики: пустые строки при сохранении отбрасываются
	let attributes = $state<Array<{ name: string; value: string; unit: string }>>([]);

	// Остатки по точкам. quantity товара больше не редактируется: это сумма по точкам
	let locations = $state<Location[]>([]);
	let stock = $state<Record<number, number>>({});
	let initialStock: Record<number, number> = {};
	let detailsLoading = $state(true);
	let detailsError = $state<string | null>(null);

	// Файлы загружаются после сохранения товара: у нового товара ещё нет id
	let pendingFiles = $state<File[]>([]);
	let fileInput: HTMLInputElement | undefined = $state();

	// Добавление изображения по ссылке: инлайн-поле вместо prompt()
	let newImageUrl = $state('');
	let imageError = $state<string | null>(null);

	let isSubmitting = $state(false);
	let error = $state<string | null>(null);

	const stockTotal = $derived(Object.values(stock).reduce((sum, value) => sum + (Number(value) || 0), 0));

	onMount(async () => {
		try {
			// Список товаров не несёт характеристик и остатков: берём полную карточку
			const [allLocations, full] = await Promise.all([
				locationsApi.getLocations(),
				product ? productsApi.getProductById(product.id, { asStaff: true }) : Promise.resolve(null)
			]);
			locations = allLocations;
			const byLocation = new Map((full?.stocks ?? []).map((row) => [row.locationId, row.quantity]));
			initialStock = Object.fromEntries(allLocations.map((location) => [location.id, byLocation.get(location.id) ?? 0]));
			stock = { ...initialStock };
			if (full) {
				images = (full.images ?? []).map((img) => ({ ...img }));
				attributes = (full.attributes ?? []).map((attribute) => ({
					name: attribute.name,
					value: attribute.value,
					unit: attribute.unit ?? ''
				}));
			}
		} catch (err) {
			detailsError = getErrorMessage(err, 'Не удалось загрузить остатки и характеристики.');
		} finally {
			detailsLoading = false;
		}
	});

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

	function addFiles(list: FileList | null) {
		if (!list) return;
		pendingFiles = [...pendingFiles, ...Array.from(list)];
		if (fileInput) fileInput.value = '';
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

		const filledAttributes = attributes.filter((a) => a.name.trim() || a.value.trim() || a.unit.trim());
		if (filledAttributes.some((a) => !a.name.trim() || !a.value.trim())) {
			error = 'У каждой характеристики должны быть название и значение';
			return;
		}

		if (Object.values(stock).some((value) => !Number.isInteger(Number(value)) || Number(value) < 0)) {
			error = 'Остаток на точке — целое число от нуля';
			return;
		}

		isSubmitting = true;

		try {
			// Пустое поле при правке очищает значение (null), при создании просто не передаётся
			const empty = product ? null : undefined;
			const payload = {
				name: name.trim(),
				slug: slug.trim() || undefined,
				description: description.trim() || empty,
				price,
				compareAtPrice: compareAtPrice > 0 ? compareAtPrice : empty,
				sku: sku.trim() || empty,
				categoryId: categoryId || empty,
				isActive,
				// Бэкенд принимает у фото только url и порядок; загруженные файлы узнаёт по url
				images: images.map((img, index) => ({ url: img.url, sortOrder: img.sortOrder ?? index })),
				attributes: filledAttributes.map((a, index) => ({
					name: a.name.trim(),
					value: a.value.trim(),
					unit: a.unit.trim() || undefined,
					sortOrder: index
				}))
			} as unknown as Partial<Product>;

			const saved = product
				? await productsApi.updateProduct(product.id, payload)
				: await productsApi.createProduct(payload);

			// Остатки и файлы — отдельные запросы: товар уже сохранён, поэтому сбой здесь не теряет правки
			const failures: string[] = [];
			for (const location of locations) {
				const next = Number(stock[location.id]) || 0;
				if (next === (initialStock[location.id] ?? 0)) continue;
				try {
					await productsApi.setStock(saved.id, location.id, next);
				} catch (err) {
					failures.push(`остаток «${location.name}»: ${getErrorMessage(err, 'ошибка')}`);
				}
			}
			for (const file of pendingFiles) {
				try {
					await productsApi.uploadImage(saved.id, file);
				} catch (err) {
					failures.push(`фото «${file.name}»: ${getErrorMessage(err, 'не загрузилось')}`);
				}
			}

			if (failures.length) {
				error = `Товар сохранён, но не всё: ${failures.join('; ')}. Откройте товар и попробуйте ещё раз.`;
				return;
			}

			onSuccess();
		} catch (err) {
			error = getErrorMessage(err, 'Не удалось сохранить товар');
		} finally {
			isSubmitting = false;
		}
	}

	const inputClass =
		'w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500';
</script>

<div class="bg-gray-50 rounded-lg p-6 border-2 border-blue-500">
	<h2 class="text-title text-ink mb-4">
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
				<input id="{formId}-name" type="text" bind:value={name} required maxlength="255" class={inputClass} />
			</div>

			<div>
				<label for="{formId}-slug" class="block text-sm font-medium text-gray-700 mb-1">Slug</label>
				<input
					id="{formId}-slug"
					type="text"
					bind:value={slug}
					placeholder="Автоматически из названия"
					class={inputClass}
				/>
			</div>
		</div>

		<div>
			<label for="{formId}-description" class="block text-sm font-medium text-gray-700 mb-1">Описание</label>
			<textarea id="{formId}-description" bind:value={description} rows="4" class={inputClass}></textarea>
		</div>

		<div class="grid grid-cols-1 md:grid-cols-3 gap-4">
			<div>
				<label for="{formId}-price" class="block text-sm font-medium text-gray-700 mb-1">
					Цена <span class="text-red-500" aria-hidden="true">*</span>
				</label>
				<input id="{formId}-price" type="number" bind:value={price} min="0" step="0.01" required class={inputClass} />
			</div>

			<div>
				<label for="{formId}-compare-price" class="block text-sm font-medium text-gray-700 mb-1">Старая цена</label>
				<input id="{formId}-compare-price" type="number" bind:value={compareAtPrice} min="0" step="0.01" class={inputClass} />
			</div>

			<div>
				<label for="{formId}-sku" class="block text-sm font-medium text-gray-700 mb-1">Артикул</label>
				<input id="{formId}-sku" type="text" bind:value={sku} class={inputClass} />
			</div>
		</div>

		<div>
			<label for="{formId}-category" class="block text-sm font-medium text-gray-700 mb-1">Категория</label>
			<select id="{formId}-category" bind:value={categoryId} class="{inputClass} md:w-1/2">
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

		<!-- Остатки по точкам -->
		<fieldset class="m-0 min-w-0 border-0 p-0">
			<legend class="mb-2 block text-sm font-medium text-gray-700">
				Остатки по точкам <span class="font-normal text-gray-500">· всего {stockTotal}&nbsp;шт.</span>
			</legend>
			{#if detailsLoading}
				<p class="text-sm text-gray-500" role="status">Загружаем точки…</p>
			{:else if detailsError}
				<p class="text-sm text-red-700" role="alert">{detailsError}</p>
			{:else if locations.length === 0}
				<p class="text-sm text-gray-600">
					Точек продаж ещё нет. Без них товар нельзя заказать:
					<a href="/admin/locations" class="underline underline-offset-4">добавьте склад или пункт выдачи</a>.
				</p>
			{:else}
				<p class="mb-2 text-sm text-gray-500">
					Доставка списывается со склада, самовывоз — с выбранной точки.
				</p>
				<div class="grid gap-2 sm:grid-cols-2">
					{#each locations as location (location.id)}
						<div class="flex items-center gap-3">
							<label for="{formId}-stock-{location.id}" class="min-w-0 flex-1 text-sm text-gray-700">
								<span class="block truncate">{location.name}</span>
								<span class="block text-xs text-gray-500">
									{LOCATION_TYPES[location.type]}{location.isActive ? '' : ', выключена'}
								</span>
							</label>
							<input
								id="{formId}-stock-{location.id}"
								type="number"
								min="0"
								step="1"
								bind:value={stock[location.id]}
								class="w-24 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
							/>
						</div>
					{/each}
				</div>
			{/if}
		</fieldset>

		<!-- Характеристики -->
		<fieldset class="m-0 min-w-0 border-0 p-0">
			<legend class="mb-2 block text-sm font-medium text-gray-700">Характеристики</legend>
			<div class="space-y-2">
				{#each attributes as attribute, index (index)}
					<div class="flex flex-wrap items-center gap-2">
						<input
							type="text"
							bind:value={attribute.name}
							aria-label="Название характеристики {index + 1}"
							placeholder="Например, Вес"
							maxlength="255"
							class="min-w-[8rem] flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
						/>
						<input
							type="text"
							bind:value={attribute.value}
							aria-label="Значение характеристики {index + 1}"
							placeholder="1,2"
							maxlength="255"
							class="min-w-[6rem] flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
						/>
						<input
							type="text"
							bind:value={attribute.unit}
							aria-label="Единица характеристики {index + 1}"
							placeholder="кг"
							maxlength="50"
							class="w-20 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
						/>
						<button
							type="button"
							onclick={() => (attributes = attributes.filter((_, i) => i !== index))}
							class="px-3 py-2 border border-gray-300 text-red-600 rounded-md hover:bg-red-50 transition-colors"
						>
							Удалить
						</button>
					</div>
				{/each}
				<button
					type="button"
					onclick={() => (attributes = [...attributes, { name: '', value: '', unit: '' }])}
					class="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
				>
					+ Добавить характеристику
				</button>
			</div>
		</fieldset>

		<!-- Изображения -->
		<fieldset class="m-0 min-w-0 border-0 p-0">
			<legend class="block text-sm font-medium text-gray-700 mb-2">Изображения</legend>
			<div class="space-y-2">
				{#each images as image, index (image.url)}
					<div class="flex flex-wrap items-center gap-2">
						<img
							src={image.thumbnailUrl ?? image.url}
							alt=""
							class="h-10 w-10 shrink-0 rounded object-cover bg-gray-200"
							loading="lazy"
						/>
						{#if image.thumbnailUrl}
							<!-- Загруженный файл: ссылку не редактируем, только порядок и удаление -->
							<span class="min-w-0 flex-1 truncate text-sm text-gray-600" title={image.url}>
								Загруженное фото{image.width ? `, ${image.width}×${image.height}` : ''}
							</span>
						{:else}
							<input
								type="url"
								bind:value={image.url}
								aria-label="Ссылка на изображение {index + 1}"
								class="flex-1 min-w-0 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
							/>
						{/if}
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

				{#each pendingFiles as file, index (file.name + index)}
					<div class="flex flex-wrap items-center gap-2">
						<span class="min-w-0 flex-1 truncate text-sm text-gray-700">
							{file.name} <span class="text-gray-500">· загрузится при сохранении</span>
						</span>
						<button
							type="button"
							onclick={() => (pendingFiles = pendingFiles.filter((_, i) => i !== index))}
							class="px-3 py-2 border border-gray-300 text-red-600 rounded-md hover:bg-red-50 transition-colors"
						>
							Убрать
						</button>
					</div>
				{/each}

				<div class="flex flex-wrap items-center gap-2 pt-1">
					<label
						class="inline-flex cursor-pointer items-center px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-blue-500"
					>
						<input
							bind:this={fileInput}
							type="file"
							accept={IMAGE_TYPES}
							multiple
							onchange={(e) => addFiles(e.currentTarget.files)}
							class="sr-only"
						/>
						Загрузить файлы
					</label>
					<span class="text-xs text-gray-500">JPEG, PNG, WebP, AVIF или GIF. Сожмём и сделаем превью сами.</span>
				</div>

				<div class="flex flex-wrap items-start gap-2 pt-1">
					<div class="flex-1 min-w-[12rem]">
						<label for="{formId}-new-image" class="sr-only">Ссылка на новое изображение</label>
						<input
							id="{formId}-new-image"
							type="url"
							bind:value={newImageUrl}
							placeholder="Или ссылка: https://example.com/photo.jpg"
							aria-invalid={imageError ? 'true' : undefined}
							aria-describedby={imageError ? `${formId}-image-error` : undefined}
							onkeydown={(e) => {
								if (e.key === 'Enter') {
									e.preventDefault();
									addImage();
								}
							}}
							class={inputClass}
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
						+ Добавить по ссылке
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
