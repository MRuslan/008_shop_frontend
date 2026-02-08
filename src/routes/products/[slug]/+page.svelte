<script lang="ts">
	import { onMount } from 'svelte';
	import type { Product, Category } from '$lib/types/product';
	import { formatPrice } from '$lib/utils/format';
	import { storeSettings } from '$lib/stores/store';
	import { cartApi } from '$lib/api/cart';
	import { cartStore } from '$lib/stores/cart';
	import { authStore } from '$lib/stores/auth';
	import { wishlistApi } from '$lib/api/wishlist';
	import { getOrCreateSessionId } from '$lib/utils/session';
	import ProductReviews from '$lib/components/product/ProductReviews.svelte';

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

	const images = data.product.images || [];
	const mainImage = images[selectedImageIndex]?.url || images[0]?.url;

	async function addToCart() {
		if (data.product.quantity < quantity) {
			addToCartError = 'Недостаточно товара на складе';
			return;
		}

		isAddingToCart = true;
		addToCartError = null;

		try {
			// Используем JWT если пользователь авторизован, иначе sessionId
			const useSessionId = !$authStore.isAuthenticated;
			
			const cart = await cartApi.addItem(
				{ productId: data.product.id, quantity },
				useSessionId
			);
			
			cartStore.setCart(cart);
			
			// Показываем уведомление (можно добавить toast)
			alert('Товар добавлен в корзину!');
		} catch (error: any) {
			const message = error.message || 'Ошибка при добавлении товара в корзину';
			if (Array.isArray(message)) {
				addToCartError = message.join(', ');
			} else {
				addToCartError = message;
			}
		} finally {
			isAddingToCart = false;
		}
	}

	function increaseQuantity() {
		if (quantity < data.product.quantity) {
			quantity++;
		}
	}

	function decreaseQuantity() {
		if (quantity > 1) {
			quantity--;
		}
	}

	// Проверяем, есть ли товар в избранном
	onMount(async () => {
		if ($authStore.isAuthenticated) {
			try {
				const wishlist = await wishlistApi.getWishlist();
				isInWishlist = wishlist.some((item) => item.productId === data.product.id);
			} catch (error) {
				// Игнорируем ошибку
			}
		}
	});

	async function toggleWishlist() {
		if (!$authStore.isAuthenticated) {
			// Показываем модальное окно авторизации
			const event = new CustomEvent('open-auth-modal');
			window.dispatchEvent(event);
			return;
		}

		isTogglingWishlist = true;

		try {
			if (isInWishlist) {
				await wishlistApi.removeFromWishlist(data.product.id);
				isInWishlist = false;
			} else {
				await wishlistApi.addToWishlist(data.product.id);
				isInWishlist = true;
			}
		} catch (error: any) {
			console.error('Wishlist error:', error);
		} finally {
			isTogglingWishlist = false;
		}
	}
</script>

<svelte:head>
	<title>{data.product.name} - {$storeSettings?.name || 'Магазин'}</title>
	<meta name="description" content={data.product.description || data.product.name} />
	{#if mainImage}
		<meta property="og:image" content={mainImage} />
	{/if}
	<meta property="og:title" content={data.product.name} />
	<meta property="og:description" content={data.product.description || data.product.name} />
	
	<!-- JSON-LD для структурированных данных -->
	{@html `<script type="application/ld+json">${JSON.stringify({
		"@context": "https://schema.org/",
		"@type": "Product",
		"name": data.product.name,
		"description": data.product.description || data.product.name,
		"image": images.length > 0 ? images.map(img => img.url) : [],
		"offers": {
			"@type": "Offer",
			"price": data.product.price,
			"priceCurrency": $storeSettings?.currency || "RUB",
			"availability": data.product.quantity > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock"
		}
	})}</script>`}
</svelte:head>

<div class="container mx-auto px-4 py-8">
	<!-- Хлебные крошки -->
	<nav class="text-sm text-gray-600 mb-4">
		<a href="/" class="hover:text-gray-900">Главная</a>
		<span class="mx-2">/</span>
		<a href="/catalog" class="hover:text-gray-900">Каталог</a>
		{#if data.category}
			<span class="mx-2">/</span>
			<a href="/categories/{data.category.slug}" class="hover:text-gray-900">{data.category.name}</a>
		{/if}
		<span class="mx-2">/</span>
		<span class="text-gray-900">{data.product.name}</span>
	</nav>

	<div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
		<!-- Изображения -->
		<div>
			<!-- Главное изображение -->
			<div class="aspect-square bg-gray-100 rounded-lg overflow-hidden mb-4">
				{#if mainImage}
					<img
						src={mainImage}
						alt={data.product.name}
						class="w-full h-full object-cover"
					/>
				{:else}
					<div class="w-full h-full flex items-center justify-center text-gray-400">
						<svg class="w-24 h-24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
					{#each images as image, index}
						<button
							onclick={() => selectedImageIndex = index}
							class="aspect-square bg-gray-100 rounded overflow-hidden border-2 transition-colors"
							class:border-blue-600={selectedImageIndex === index}
							class:border-gray-300={selectedImageIndex !== index}
						>
							<img
								src={image.url}
								alt="{data.product.name} - изображение {index + 1}"
								class="w-full h-full object-cover"
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

			<h1 class="text-3xl font-bold text-gray-800 mb-4">{data.product.name}</h1>

			<!-- Цена -->
			<div class="mb-6">
				<div class="flex items-center space-x-4 mb-2">
					<span class="text-3xl font-bold text-gray-900">
						{formatPrice(data.product.price, $storeSettings?.currency || 'RUB')}
					</span>
					{#if data.product.compareAtPrice && parseFloat(data.product.compareAtPrice) > parseFloat(data.product.price)}
						<span class="text-xl text-gray-500 line-through">
							{formatPrice(data.product.compareAtPrice, $storeSettings?.currency || 'RUB')}
						</span>
					{/if}
				</div>
				{#if data.product.compareAtPrice && parseFloat(data.product.compareAtPrice) > parseFloat(data.product.price)}
					<span class="text-sm text-green-600 font-medium">
						Скидка {Math.round((1 - parseFloat(data.product.price) / parseFloat(data.product.compareAtPrice)) * 100)}%
					</span>
				{/if}
			</div>

			<!-- Наличие -->
			<div class="mb-6">
				{#if data.product.quantity > 0}
					<span class="inline-block px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
						В наличии ({data.product.quantity} шт.)
					</span>
				{:else}
					<span class="inline-block px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm font-medium">
						Нет в наличии
					</span>
				{/if}
			</div>

			<!-- Описание -->
			{#if data.product.description}
				<div class="mb-6">
					<h2 class="text-lg font-semibold text-gray-800 mb-2">Описание</h2>
					<p class="text-gray-600 whitespace-pre-line">{data.product.description}</p>
				</div>
			{/if}

			<!-- Артикул -->
			{#if data.product.sku}
				<div class="mb-6">
					<p class="text-sm text-gray-500">Артикул: <span class="font-medium">{data.product.sku}</span></p>
				</div>
			{/if}

			<!-- Добавление в корзину -->
			<div class="border-t pt-6">
				{#if addToCartError}
					<div class="mb-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
						{addToCartError}
					</div>
				{/if}

				{#if data.product.quantity > 0}
					<div class="flex items-center space-x-4 mb-4">
						<label class="text-sm font-medium text-gray-700">Количество:</label>
						<div class="flex items-center border border-gray-300 rounded">
							<button
								onclick={decreaseQuantity}
								disabled={quantity <= 1}
								class="px-3 py-2 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
							>
								−
							</button>
							<input
								type="number"
								bind:value={quantity}
								min="1"
								max={data.product.quantity}
								class="w-16 text-center border-0 focus:outline-none"
							/>
							<button
								onclick={increaseQuantity}
								disabled={quantity >= data.product.quantity}
								class="px-3 py-2 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
							>
								+
							</button>
						</div>
					</div>

					<div class="flex space-x-2">
						<button
							onclick={addToCart}
							disabled={isAddingToCart}
							class="flex-1 bg-blue-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
						>
							{isAddingToCart ? 'Добавление...' : 'Добавить в корзину'}
						</button>
						<button
							onclick={toggleWishlist}
							disabled={isTogglingWishlist}
							class="p-3 border-2 rounded-lg transition-colors disabled:opacity-50"
							class:border-red-500={isInWishlist}
							class:text-red-600={isInWishlist}
							class:border-gray-300={!isInWishlist}
							class:text-gray-600={!isInWishlist}
							class:hover:bg-red-50={isInWishlist}
							class:hover:bg-gray-50={!isInWishlist}
							aria-label={isInWishlist ? 'Удалить из избранного' : 'Добавить в избранное'}
						>
							<svg
								class="w-6 h-6"
								fill={isInWishlist ? 'currentColor' : 'none'}
								stroke="currentColor"
								viewBox="0 0 24 24"
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
		<ProductReviews productId={data.product.id} />
	</div>
</div>
