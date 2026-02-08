<script lang="ts">
	import { onMount } from 'svelte';
	import { wishlistApi } from '$lib/api/wishlist';
	import type { WishlistItem } from '$lib/types/common';
	import ProductCard from '$lib/components/product/ProductCard.svelte';

	let wishlistItems = $state<WishlistItem[]>([]);
	let isLoading = $state(true);
	let error = $state<string | null>(null);

	onMount(async () => {
		await loadWishlist();
	});

	async function loadWishlist() {
		isLoading = true;
		error = null;

		try {
			wishlistItems = await wishlistApi.getWishlist();
		} catch (err: any) {
			error = err.message || 'Ошибка загрузки избранного';
		} finally {
			isLoading = false;
		}
	}

	async function handleRemove(productId: number) {
		try {
			await wishlistApi.removeFromWishlist(productId);
			await loadWishlist();
		} catch (err: any) {
			error = err.message || 'Ошибка удаления из избранного';
		}
	}
</script>

<svelte:head>
	<title>Избранное - Личный кабинет</title>
	<meta name="description" content="Ваши избранные товары" />
</svelte:head>

<div class="bg-white rounded-lg shadow-md p-6">
	<h1 class="text-2xl font-bold text-gray-800 mb-6">Избранное</h1>

	{#if error}
		<div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
			{error}
		</div>
	{/if}

	{#if isLoading}
		<div class="text-center py-12">
			<p class="text-gray-500">Загрузка избранного...</p>
		</div>
	{:else if wishlistItems.length === 0}
		<div class="text-center py-12">
			<svg
				class="mx-auto h-24 w-24 text-gray-400 mb-4"
				fill="none"
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
			<p class="text-gray-500 mb-4">У вас пока нет избранных товаров</p>
			<a href="/catalog" class="text-blue-600 hover:text-blue-800">Перейти в каталог</a>
		</div>
	{:else}
		<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
			{#each wishlistItems as item (item.id)}
				<div class="relative">
					<ProductCard product={item.product} />
					<button
						onclick={() => handleRemove(item.productId)}
						class="absolute top-2 right-2 p-2 bg-white rounded-full shadow-md hover:bg-red-50 text-red-600 transition-colors"
						aria-label="Удалить из избранного"
					>
						<svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
							<path
								fill-rule="evenodd"
								d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z"
								clip-rule="evenodd"
							/>
						</svg>
					</button>
				</div>
			{/each}
		</div>
	{/if}
</div>
