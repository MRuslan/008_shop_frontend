<script lang="ts">
	import { onMount } from 'svelte';
	import { cartStore } from '$lib/stores/cart';
	import { authStore } from '$lib/stores/auth';
	import { cartApi } from '$lib/api/cart';
	import { confirmDialog } from '$lib/stores/confirm';
	import CartItem from '$lib/components/cart/CartItem.svelte';
	import CartSummary from '$lib/components/cart/CartSummary.svelte';
	import { getErrorMessage } from '$lib/utils/errors';
	import { toast } from '$lib/stores/toast';
	import { pluralize } from '$lib/utils/format';

	let isLoading = $state(true);
	let isUpdating = $state(false);
	let error = $state<string | null>(null);

	onMount(async () => {
		await loadCart();
	});

	async function loadCart() {
		isLoading = true;
		error = null;

		try {
			const useSessionId = !$authStore.isAuthenticated;
			const cart = await cartApi.getCart(useSessionId);
			cartStore.setCart(cart);
		} catch (err) {
			error = getErrorMessage(err, 'Не удалось загрузить корзину.');
			cartStore.clear();
		} finally {
			isLoading = false;
		}
	}

	async function handleUpdateQuantity(itemId: number, quantity: number) {
		if (quantity < 1) return;

		isUpdating = true;
		error = null;

		try {
			const useSessionId = !$authStore.isAuthenticated;
			const cart = await cartApi.updateItem(itemId, { quantity }, useSessionId);
			cartStore.setCart(cart);
		} catch (err) {
			error = getErrorMessage(err, 'Не удалось изменить количество. Корзина обновлена до актуального состояния.');
			await loadCart(); // Перезагружаем корзину при ошибке
		} finally {
			isUpdating = false;
		}
	}

	async function handleRemoveItem(itemId: number) {
		const removed = $cartStore?.items.find((item) => item.id === itemId);
		isUpdating = true;
		error = null;

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
			error = getErrorMessage(err, 'Не удалось убрать товар. Попробуйте ещё раз.');
			await loadCart(); // Перезагружаем корзину при ошибке
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
		error = null;

		try {
			const useSessionId = !$authStore.isAuthenticated;
			await cartApi.clearCart(useSessionId);
			cartStore.clear();
		} catch (err) {
			error = getErrorMessage(err, 'Не удалось очистить корзину. Попробуйте ещё раз.');
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
	<h1 class="text-3xl font-bold text-gray-800 mb-6">Корзина</h1>

	{#if isLoading}
		<div class="text-center py-12">
			<p class="text-gray-500" role="status">Загружаем корзину…</p>
		</div>
	{:else if error}
		<div role="alert" class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
			{error}
		</div>
		<button
			type="button"
			onclick={loadCart}
			class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
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
			<p class="text-xl text-gray-800">В корзине пока ничего нет</p>
			<p class="mt-1 mb-4 text-gray-600">Добавляйте товары кнопкой «В корзину» в каталоге.</p>
			<a
				href="/catalog"
				class="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
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
						class="px-4 py-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded transition-colors disabled:opacity-50"
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
