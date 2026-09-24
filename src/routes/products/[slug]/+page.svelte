<script lang="ts">
	import { page } from '$app/state';
	import type { Product, Category } from '$lib/types/product';
	import { formatPrice } from '$lib/utils/format';
	import { storeSettings } from '$lib/stores/store';
	import { cartApi } from '$lib/api/cart';
	import { cartStore } from '$lib/stores/cart';
	import { authStore } from '$lib/stores/auth';
	import { wishlistApi } from '$lib/api/wishlist';
	import { toast } from '$lib/stores/toast';
	import { getErrorMessage } from '$lib/utils/errors';
	import ProductReviews from '$lib/components/product/ProductReviews.svelte';
	import { generateProductJsonLd, generateBreadcrumbJsonLd } from '$lib/utils/seo';

	interface Props {
		data: {
			product: Product;
			category: Category | null;
		};
	}

	let { data }: Props = $props();

	let selectedImageIndex = $state(0);
	let quantity = $state(1);
	let isAddingToCart = $state(false);
	let addToCartError = $state<string | null>(null);
	let isInWishlist = $state(false);
	let isTogglingWishlist = $state(false);

	// Всё, что зависит от товара, выводим из data: при переходе между товарами без перезагрузки ничего не устаревает
	const product = $derived(data.product);
	const images = $derived(product.images ?? []);
	const mainImage = $derived(images[selectedImageIndex]?.url ?? images[0]?.url);
	const hasDiscount = $derived(
		!!product.compareAtPrice && parseFloat(product.compareAtPrice) > parseFloat(product.price)
	);
	const discountPercent = $derived(
		hasDiscount && product.compareAtPrice
			? Math.round((1 - parseFloat(product.price) / parseFloat(product.compareAtPrice)) * 100)
			: 0
	);
	const currency = $derived($storeSettings?.currency || 'RUB');

	// Открыли другой товар: сбрасываем галерею, количество и ошибки
	$effect(() => {
		if (product.id) {
			selectedImageIndex = 0;
			quantity = 1;
			addToCartError = null;
		}
	});

	// Проверяем, есть ли товар в избранном (при смене товара и при входе/выходе)
	$effect(() => {
		if (!$authStore.isAuthenticated) {
			isInWishlist = false;
			return;
		}
		const productId = product.id;
		let cancelled = false;
		wishlistApi
			.getWishlist()
			.then((items) => {
				if (!cancelled) isInWishlist = items.some((item) => item.productId === productId);
			})
			.catch(() => {
				// Избранное не критично для страницы: молча оставляем состояние по умолчанию
			});
		return () => {
			cancelled = true;
		};
	});

	async function addToCart() {
		if (product.quantity < quantity) {
			addToCartError = 'Недостаточно товара на складе';
			return;
		}

		isAddingToCart = true;
		addToCartError = null;

		try {
			// JWT для авторизованного пользователя, X-Session-Id для гостя
			const cart = await cartApi.addItem(
				{ productId: product.id, quantity },
				!$authStore.isAuthenticated
			);
			cartStore.setCart(cart);
			toast.success(`«${product.name}» добавлен в корзину`, {
				action: { label: 'Перейти в корзину', href: '/cart' }
			});
		} catch (err) {
			addToCartError = getErrorMessage(err, 'Не удалось добавить товар в корзину');
		} finally {
			isAddingToCart = false;
		}
	}

	function increaseQuantity() {
		if (quantity < product.quantity) quantity++;
	}

	function decreaseQuantity() {
		if (quantity > 1) quantity--;
	}

	function clampQuantity() {
		if (!Number.isFinite(quantity) || quantity < 1) quantity = 1;
		if (quantity > product.quantity) quantity = product.quantity;
	}

	async function toggleWishlist() {
		if (!$authStore.isAuthenticated) {
			window.dispatchEvent(new CustomEvent('open-auth-modal'));
			return;
		}

		isTogglingWishlist = true;

		try {
			if (isInWishlist) {
				await wishlistApi.removeFromWishlist(product.id);
				isInWishlist = false;
				toast.info('Товар убран из избранного');
			} else {
				await wishlistApi.addToWishlist(product.id);
				isInWishlist = true;
				toast.success('Товар добавлен в избранное', {
					action: { label: 'Открыть избранное', href: '/account/wishlist' }
				});
			}
		} catch (err) {
			toast.error(getErrorMessage(err, 'Не удалось обновить избранное'));
		} finally {
			isTogglingWishlist = false;
		}
	}

	const siteUrl = $derived(page.url.origin);
	const siteName = $derived($storeSettings?.name || 'Магазин');
	const productUrl = $derived(`${siteUrl}/products/${product.slug}`);
	const productDescription = $derived(product.description || product.name);

	const breadcrumbs = $derived([
		{ name: 'Главная', url: '/' },
		{ name: 'Каталог', url: '/catalog' },
		...(data.category
			? [{ name: data.category.name, url: `/categories/${data.category.slug}` }]
			: []),
		{ name: product.name, url: `/products/${product.slug}` }
	]);
</script>

<svelte:head>
	<title>{product.name} | {siteName}</title>
	<meta name="description" content={productDescription} />
	<meta property="og:title" content={product.name} />
	<meta property="og:description" content={productDescription} />
	<meta property="og:type" content="product" />
	<meta property="og:url" content={productUrl} />
	{#if mainImage}
		<meta property="og:image" content={mainImage} />
	{/if}
	<meta property="og:site_name" content={siteName} />
	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:title" content={product.name} />
	<meta name="twitter:description" content={productDescription} />
	{#if mainImage}
		<meta name="twitter:image" content={mainImage} />
	{/if}
	<meta property="product:price:amount" content={product.price} />
	<meta property="product:price:currency" content={currency} />
	<link rel="canonical" href={productUrl} />

	{@html `<script type="application/ld+json">${JSON.stringify(generateProductJsonLd(product, $storeSettings, siteUrl))}</script>`}
	{@html `<script type="application/ld+json">${JSON.stringify(generateBreadcrumbJsonLd(breadcrumbs, siteUrl))}</script>`}
</svelte:head>

<div class="container mx-auto px-4 py-8">
	<!-- Хлебные крошки -->
	<nav class="text-sm text-gray-600 mb-4" aria-label="Вы здесь">
		<a href="/" class="hover:text-gray-900">Главная</a>
		<span class="mx-2" aria-hidden="true">/</span>
		<a href="/catalog" class="hover:text-gray-900">Каталог</a>
		{#if data.category}
			<span class="mx-2" aria-hidden="true">/</span>
			<a href="/categories/{data.category.slug}" class="hover:text-gray-900">{data.category.name}</a>
		{/if}
		<span class="mx-2" aria-hidden="true">/</span>
		<span class="text-gray-900" aria-current="page">{product.name}</span>
	</nav>

	<div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
		<!-- Изображения -->
		<div>
			<!-- Главное изображение -->
			<div class="aspect-square bg-gray-100 rounded-lg overflow-hidden mb-4">
				{#if mainImage}
					<img
						src={mainImage}
						alt={product.name}
						class="w-full h-full object-cover"
						loading="eager"
						fetchpriority="high"
					/>
				{:else}
					<div class="w-full h-full flex items-center justify-center text-gray-400">
						<svg class="w-24 h-24" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
							/>
						</svg>
					</div>
				{/if}
			</div>

			<!-- Миниатюры -->
			{#if images.length > 1}
				<div class="grid grid-cols-4 gap-2">
					{#each images as image, index (image.url)}
						<button
							type="button"
							onclick={() => (selectedImageIndex = index)}
							aria-label="Показать изображение {index + 1} из {images.length}"
							aria-pressed={selectedImageIndex === index}
							class="aspect-square bg-gray-100 rounded overflow-hidden border-2 transition-colors focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:outline-none"
							class:border-blue-600={selectedImageIndex === index}
							class:border-gray-300={selectedImageIndex !== index}
						>
							<img
								src={image.url}
								alt=""
								class="w-full h-full object-cover"
								loading="lazy"
							/>
						</button>
					{/each}
				</div>
			{/if}
		</div>

		<!-- Информация о товаре -->
		<div>
			{#if data.category}
				<p class="text-sm text-gray-500 mb-2">{data.category.name}</p>
			{/if}

			<h1 class="text-3xl font-bold text-gray-800 mb-4 text-balance">{product.name}</h1>

			<!-- Цена -->
			<div class="mb-6">
				<div class="flex items-center space-x-4 mb-2">
					<span class="text-3xl font-bold text-gray-900">
						{formatPrice(product.price, currency)}
					</span>
					{#if hasDiscount && product.compareAtPrice}
						<span class="text-xl text-gray-500 line-through">
							{formatPrice(product.compareAtPrice, currency)}
						</span>
					{/if}
				</div>
				{#if hasDiscount}
					<span class="text-sm text-green-700 font-medium">
						Скидка {discountPercent}%
					</span>
				{/if}
			</div>

			<!-- Наличие -->
			<div class="mb-6">
				{#if product.quantity > 0}
					<span class="inline-block px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
						В наличии ({product.quantity} шт.)
					</span>
				{:else}
					<span class="inline-block px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm font-medium">
						Нет в наличии
					</span>
				{/if}
			</div>

			<!-- Описание -->
			{#if product.description}
				<div class="mb-6">
					<h2 class="text-lg font-semibold text-gray-800 mb-2">Описание</h2>
					<p class="text-gray-600 whitespace-pre-line break-words">{product.description}</p>
				</div>
			{/if}

			<!-- Артикул -->
			{#if product.sku}
				<div class="mb-6">
					<p class="text-sm text-gray-500">Артикул: <span class="font-medium">{product.sku}</span></p>
				</div>
			{/if}

			<!-- Добавление в корзину -->
			<div class="border-t pt-6">
				{#if addToCartError}
					<div role="alert" class="mb-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
						{addToCartError}
					</div>
				{/if}

				{#if product.quantity > 0}
					<div class="flex items-center space-x-4 mb-4">
						<label for="product-quantity" class="text-sm font-medium text-gray-700">Количество:</label>
						<div class="flex items-center border border-gray-300 rounded">
							<button
								type="button"
								onclick={decreaseQuantity}
								disabled={quantity <= 1}
								aria-label="Уменьшить количество"
								class="inline-flex min-h-11 min-w-11 items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
							>
								−
							</button>
							<input
								id="product-quantity"
								type="number"
								bind:value={quantity}
								onchange={clampQuantity}
								min="1"
								max={product.quantity}
								inputmode="numeric"
								class="w-14 min-h-11 text-center border-0 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
							/>
							<button
								type="button"
								onclick={increaseQuantity}
								disabled={quantity >= product.quantity}
								aria-label="Увеличить количество"
								class="inline-flex min-h-11 min-w-11 items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
							>
								+
							</button>
						</div>
					</div>

					<div class="flex space-x-2">
						<button
							type="button"
							onclick={addToCart}
							disabled={isAddingToCart}
							class="flex-1 bg-blue-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
						>
							{isAddingToCart ? 'Добавление...' : 'Добавить в корзину'}
						</button>
						<button
							type="button"
							onclick={toggleWishlist}
							disabled={isTogglingWishlist}
							class="p-3 border-2 rounded-lg transition-colors disabled:opacity-50"
							class:border-red-500={isInWishlist}
							class:text-red-600={isInWishlist}
							class:border-gray-300={!isInWishlist}
							class:text-gray-600={!isInWishlist}
							class:hover:bg-red-50={isInWishlist}
							class:hover:bg-gray-50={!isInWishlist}
							aria-pressed={isInWishlist}
							aria-label={isInWishlist ? 'Удалить из избранного' : 'Добавить в избранное'}
						>
							<svg
								class="w-6 h-6"
								fill={isInWishlist ? 'currentColor' : 'none'}
								stroke="currentColor"
								viewBox="0 0 24 24"
								aria-hidden="true"
							>
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
								/>
							</svg>
						</button>
					</div>
				{:else}
					<button
						type="button"
						disabled
						class="w-full bg-gray-300 text-gray-500 py-3 px-6 rounded-lg font-medium cursor-not-allowed"
					>
						Товар недоступен
					</button>
				{/if}
			</div>
		</div>
	</div>

	<!-- Отзывы -->
	<div class="mt-12">
		{#key product.id}
			<ProductReviews productId={product.id} />
		{/key}
	</div>
</div>
