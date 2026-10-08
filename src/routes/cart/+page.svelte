<script lang="ts">
	import { onMount } from 'svelte';
	import { cartStore, cartReady } from '$lib/stores/cart';
	import { cartApi } from '$lib/api/cart';
	import { confirmDialog } from '$lib/stores/confirm';
	import CartItem from '$lib/components/cart/CartItem.svelte';
	import CartSummary from '$lib/components/cart/CartSummary.svelte';
	import Skeleton from '$lib/components/ui/Skeleton.svelte';
	import ShoppingCart from '@lucide/svelte/icons/shopping-cart';
	import { getErrorMessage } from '$lib/utils/errors';
	import { toast } from '$lib/stores/toast';
	import { pluralize } from '$lib/utils/format';

	let isUpdating = $state(false);

	// Корзину отдаёт корневой layout вместе со страницей. null значит ошибку загрузки
	// (пустую корзину бэкенд отдаёт с пустым items)
	const isLoading = $derived(!$cartReady);
	const loadFailed = $derived($cartReady && !$cartStore);

	// Корзина уже на странице: показываем её сразу и тихо обновляем, вдруг остатки или цены изменились
	onMount(() => {
		if ($cartStore) cartStore.reload();
	});

	async function handleUpdateQuantity(itemId: number, quantity: number) {
		if (quantity < 1) return;

		isUpdating = true;

		try {
			const cart = await cartApi.updateItem(itemId, { quantity });
			cartStore.setCart(cart);
		} catch (err) {
			toast.error(getErrorMessage(err, 'Не удалось изменить количество. Показываем актуальную корзину.'));
			await cartStore.reload();
		} finally {
			isUpdating = false;
		}
	}

	async function handleRemoveItem(itemId: number) {
		const removed = $cartStore?.items.find((item) => item.id === itemId);
		isUpdating = true;

		try {
			const cart = await cartApi.removeItem(itemId);
			cartStore.setCart(cart);
			if (removed) {
				// Удаление без подтверждения, зато с возможностью сразу вернуть товар
				toast.info(`«${removed.product.name}» убран из корзины`, {
					action: { label: 'Вернуть', onClick: () => restoreItem(removed.productId, removed.quantity) }
				});
			}
		} catch (err) {
			toast.error(getErrorMessage(err, 'Не удалось убрать товар. Попробуйте ещё раз.'));
			await cartStore.reload();
		} finally {
			isUpdating = false;
		}
	}

	async function restoreItem(productId: number, quantity: number) {
		try {
			await cartStore.add(productId, quantity);
		} catch (err) {
			toast.error(getErrorMessage(err, 'Не удалось вернуть товар в корзину.'));
		}
	}

	async function handleClearCart() {
		const count = $cartStore?.items.reduce((sum, item) => sum + item.quantity, 0) ?? 0;
		const confirmed = await confirmDialog({
			title: 'Очистить корзину?',
			message: `Из корзины уйдут все товары: ${count} ${pluralize(count, ['штука', 'штуки', 'штук'])}. Вернуть их можно будет только вручную.`,
			confirmLabel: 'Очистить корзину',
			danger: true
		});
		if (!confirmed) return;

		isUpdating = true;

		try {
			// Бэкенд возвращает пустую корзину; null в сторе страница сочла бы ошибкой загрузки
			cartStore.setCart(await cartApi.clearCart());
		} catch (err) {
			toast.error(getErrorMessage(err, 'Не удалось очистить корзину. Попробуйте ещё раз.'));
		} finally {
			isUpdating = false;
		}
	}
</script>

<svelte:head>
	<title>Корзина</title>
	<meta name="robots" content="noindex" />
</svelte:head>

<div class="container py-4 md:py-6">
	<h1 class="mb-4 text-headline text-balance text-ink md:mb-6 md:text-headline-lg">Корзина</h1>

	{#if isLoading}
		<!-- Заглушка в форме корзины: позиции слева, итог справа -->
		<div class="grid grid-cols-1 gap-3 lg:grid-cols-3 lg:gap-6" role="status">
			<span class="sr-only">Загружаем корзину…</span>
			<div class="space-y-3 lg:col-span-2">
				<Skeleton class="h-32 rounded-2xl" />
				<Skeleton class="h-32 rounded-2xl" />
			</div>
			<Skeleton class="h-56 rounded-2xl" />
		</div>
	{:else if loadFailed}
		<div role="alert" class="mb-4 notice-error">
			Не удалось загрузить корзину. Проверьте соединение и попробуйте ещё раз.
		</div>
		<button
			type="button"
			onclick={() => cartStore.reload()}
			class="btn-primary"
		>
			Попробовать снова
		</button>
	{:else if !$cartStore || $cartStore.items.length === 0}
		<div class="rounded-2xl bg-surface px-6 py-12 text-center">
			<ShoppingCart class="mx-auto mb-4 size-12 text-gray-300" strokeWidth={1.5} aria-hidden="true" />
			<p class="text-title-sm text-ink">В корзине пока ничего нет</p>
			<p class="mt-1 mb-5 text-body-sm text-gray-600">Добавляйте товары кнопкой «В корзину» в каталоге.</p>
			<a
				href="/catalog"
				class="btn-primary btn-lg"
			>
				Перейти в каталог
			</a>
		</div>
	{:else}
		<div class="grid grid-cols-1 gap-3 lg:grid-cols-3 lg:items-start lg:gap-6">
			<!-- Товары в корзине -->
			<section class="space-y-3 lg:col-span-2" aria-labelledby="cart-items-heading">
				<h2 id="cart-items-heading" class="sr-only">Товары в корзине</h2>
				{#each $cartStore.items as item (item.id)}
					<CartItem
						{item}
						onUpdateQuantity={handleUpdateQuantity}
						onRemove={handleRemoveItem}
						isUpdating={isUpdating}
					/>
				{/each}

				<!-- Кнопка очистки корзины -->
				<div class="flex justify-end">
					<button
						type="button"
						onclick={handleClearCart}
						disabled={isUpdating}
						class="btn-text text-negative hover:text-negative"
					>
						Очистить корзину
					</button>
				</div>
			</section>

			<!-- Итого -->
			<div class="lg:sticky lg:top-4">
				<CartSummary cart={$cartStore} />
			</div>
		</div>
	{/if}
</div>
