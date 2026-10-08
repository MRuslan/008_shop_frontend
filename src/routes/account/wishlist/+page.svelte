<script lang="ts">
	import type { WishlistItem } from '$lib/types/common';
	import ProductList from '$lib/components/product/ProductList.svelte';
	import Heart from '@lucide/svelte/icons/heart';
	import { wishlistStore, wishlistReady } from '$lib/stores/wishlist';

	let { data } = $props();

	// Список пришёл с сервера вместе со страницей; убранные сердечком товары исчезают сразу
	const wishlistItems: WishlistItem[] = $derived(data.items);
	const error = $derived(data.error);

	// Пока общий store избранного не загрузился, показываем список как пришёл с сервера
	const visibleItems = $derived(
		$wishlistReady ? wishlistItems.filter((item) => $wishlistStore.has(item.productId)) : wishlistItems
	);

</script>

<svelte:head>
	<title>Избранное - Личный кабинет</title>
	<meta name="description" content="Ваши избранные товары" />
</svelte:head>

<div class="rounded-2xl bg-surface p-5 md:p-6">
	<h1 class="text-headline text-ink mb-6">Избранное</h1>

	{#if error}
		<div role="alert" class="notice-error">
			{error}
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
