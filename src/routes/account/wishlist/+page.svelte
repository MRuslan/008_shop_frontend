<script lang="ts">
	import { onMount } from 'svelte';
	import { wishlistApi } from '$lib/api/wishlist';
	import type { WishlistItem } from '$lib/types/common';
	import ProductList from '$lib/components/product/ProductList.svelte';
	import ProductGridSkeleton from '$lib/components/product/ProductGridSkeleton.svelte';
	import Heart from '@lucide/svelte/icons/heart';
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

<div class="rounded-2xl bg-surface p-5 md:p-6">
	<h1 class="text-headline text-ink mb-6">Избранное</h1>

	{#if error}
		<div role="alert" class="mb-4 notice-error">
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
			<Heart class="mx-auto mb-4 size-12 text-gray-300" strokeWidth={1.5} aria-hidden="true" />
			<p class="text-title-sm text-ink">В избранном пока пусто</p>
			<p class="mt-1 mb-5 text-body-sm text-gray-600">Нажмите на сердечко у товара, чтобы сохранить его здесь.</p>
			<a href="/catalog" class="btn-primary">Перейти в каталог</a>
		</div>
	{:else}
		<!-- Сердечко на карточке убирает товар из избранного: список сразу это отражает -->
		<ProductList products={visibleItems.map((item) => item.product)} />
	{/if}
</div>
