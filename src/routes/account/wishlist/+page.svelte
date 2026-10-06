<script lang="ts">
	import { onMount } from 'svelte';
	import { wishlistApi } from '$lib/api/wishlist';
	import type { WishlistItem } from '$lib/types/common';
	import ProductList from '$lib/components/product/ProductList.svelte';
	import ProductGridSkeleton from '$lib/components/product/ProductGridSkeleton.svelte';
	import { wishlistStore, wishlistReady } from '$lib/stores/wishlist';
	import { getErrorMessage } from '$lib/utils/errors';

	let wishlistItems = $state<WishlistItem[]>([]);
	let isLoading = $state(true);
	let error = $state<string | null>(null);

	// Пока общий store избранного не загрузился, показываем список как пришёл с сервера
	const visibleItems = $derived(
		$wishlistReady ? wishlistItems.filter((item) => $wishlistStore.has(item.productId)) : wishlistItems
	);

	onMount(async () => {
		await loadWishlist();
	});

	async function loadWishlist() {
		isLoading = true;
		error = null;

		try {
			wishlistItems = await wishlistApi.getWishlist();
		} catch (err) {
			error = getErrorMessage(err, 'Ошибка загрузки избранного');
		} finally {
			isLoading = false;
		}
	}

</script>

<svelte:head>
	<title>Избранное - Личный кабинет</title>
	<meta name="description" content="Ваши избранные товары" />
</svelte:head>

<div class="bg-white rounded-lg shadow-md p-6">
	<h1 class="text-headline text-ink mb-6">Избранное</h1>

	{#if error}
		<div role="alert" class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
			{error}
		</div>
	{/if}

	{#if isLoading}
		<div role="status">
			<span class="sr-only">Загружаем избранное…</span>
			<ProductGridSkeleton count={3} />
		</div>
	{:else if visibleItems.length === 0}
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
			<p class="text-title-sm text-ink">В избранном пока пусто</p>
			<p class="mt-1 mb-4 text-body-sm text-gray-600">Нажмите на сердечко у товара, чтобы сохранить его здесь.</p>
			<a href="/catalog" class="text-blue-600 hover:text-blue-800">Перейти в каталог</a>
		</div>
	{:else}
		<!-- Сердечко на карточке убирает товар из избранного: список сразу это отражает -->
		<ProductList products={visibleItems.map((item) => item.product)} />
	{/if}
</div>
