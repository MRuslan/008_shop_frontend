<script lang="ts">
	import { onMount } from 'svelte';
	import { cartStore, cartReady } from '$lib/stores/cart';
	import { authStore } from '$lib/stores/auth';
	import { cartApi } from '$lib/api/cart';
	import { confirmDialog } from '$lib/stores/confirm';
	import CartItem from '$lib/components/cart/CartItem.svelte';
	import CartSummary from '$lib/components/cart/CartSummary.svelte';
	import Skeleton from '$lib/components/ui/Skeleton.svelte';
	import { getErrorMessage } from '$lib/utils/errors';
	import { toast } from '$lib/stores/toast';
	import { pluralize } from '$lib/utils/format';

	let isUpdating = $state(false);

	// Корзину загружает layout, когда уже известно, вошёл ли пользователь. Пока её нет — заглушка;
	// null после загрузки значит ошибку (пустую корзину бэкенд отдаёт с пустым items)
	const isLoading = $derived(!$cartReady);
	const loadFailed = $derived($cartReady && !$cartStore);

	// Корзина уже в памяти: показываем её сразу и тихо обновляем, вдруг остатки или цены изменились
	onMount(() => {
		if ($cartReady) cartStore.init();
	});

	async function handleUpdateQuantity(itemId: number, quantity: number) {
		if (quantity < 1) return;

		isUpdating = true;

		try {
			const useSessionId = !$authStore.isAuthenticated;
			const cart = await cartApi.updateItem(itemId, { quantity }, useSessionId);
			cartStore.setCart(cart);
		} catch (err) {
			toast.error(getErrorMessage(err, 'Не удалось изменить количество. Показываем актуальную корзину.'));
			await cartStore.init();
		} finally {
			isUpdating = false;
		}
	}

	async function handleRemoveItem(itemId: number) {
		const removed = $cartStore?.items.find((item) => item.id === itemId);
		isUpdating = true;

		try {
			const useSessionId = !$authStore.isAuthenticated;
			const cart = await cartApi.removeItem(itemId, useSessionId);
			cartStore.setCart(cart);
			if (removed) {
				// Удаление без подтверждения, зато с возможностью сразу вернуть товар
				toast.info(`«${removed.product.name}» убран из корзины`, {
					action: { label: 'Вернуть', onClick: () => restoreItem(removed.productId, removed.quantity) }
				});
			}
		} catch (err) {
			toast.error(getErrorMessage(err, 'Не удалось убрать товар. Попробуйте ещё раз.'));
			await cartStore.init();
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
			const useSessionId = !$authStore.isAuthenticated;
			// Бэкенд возвращает пустую корзину; null в сторе страница сочла бы ошибкой загрузки
			cartStore.setCart(await cartApi.clearCart(useSessionId));
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

<div class="container mx-auto px-4 py-8">
	<h1 class="text-headline md:text-headline-lg text-balance text-ink mb-6">Корзина</h1>

	{#if isLoading}
		<!-- Заглушка в форме корзины: позиции слева, итог справа -->
		<div class="grid grid-cols-1 gap-6 lg:grid-cols-3" role="status">
			<span class="sr-only">Загружаем корзину…</span>
			<div class="space-y-4 lg:col-span-2">
				<Skeleton class="h-32 rounded-lg" />
				<Skeleton class="h-32 rounded-lg" />
			</div>
			<Skeleton class="h-56 rounded-lg" />
		</div>
	{:else if loadFailed}
		<div role="alert" class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
			Не удалось загрузить корзину. Проверьте соединение и попробуйте ещё раз.
		</div>
		<button
			type="button"
			onclick={() => cartStore.init()}
			class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors text-control"
		>
			Попробовать снова
		</button>
	{:else if !$cartStore || $cartStore.items.length === 0}
		<div class="text-center py-12">
			<svg
				class="mx-auto h-24 w-24 text-gray-400 mb-4"
				aria-hidden="true"
				fill="none"
				stroke="currentColor"
				viewBox="0 0 24 24"
			>
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="2"
					d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L6 4H4M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
				/>
			</svg>
			<p class="text-title-sm text-ink">В корзине пока ничего нет</p>
			<p class="mt-1 mb-4 text-body-sm text-gray-600">Добавляйте товары кнопкой «В корзину» в каталоге.</p>
			<a
				href="/catalog"
				class="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-control-lg"
			>
				Перейти в каталог
			</a>
		</div>
	{:else}
		<div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
			<!-- Товары в корзине -->
			<div class="lg:col-span-2 space-y-4">
				{#each $cartStore.items as item (item.id)}
					<CartItem
						{item}
						onUpdateQuantity={handleUpdateQuantity}
						onRemove={handleRemoveItem}
						isUpdating={isUpdating}
					/>
				{/each}

				<!-- Кнопка очистки корзины -->
				<div class="flex justify-end pt-4">
					<button
						type="button"
						onclick={handleClearCart}
						disabled={isUpdating}
						class="px-4 py-2 text-negative hover:bg-red-50 rounded transition-colors disabled:opacity-50"
					>
						Очистить корзину
					</button>
				</div>
			</div>

			<!-- Итого -->
			<div class="lg:col-span-1">
				<CartSummary cart={$cartStore} />
			</div>
		</div>
	{/if}
</div>
