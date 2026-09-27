<script lang="ts">
	import type { Cart } from '$lib/types/cart';
	import { formatPrice } from '$lib/utils/format';
	import { storeSettings } from '$lib/stores/store';
	import { cartTotal } from '$lib/stores/cart';
	import { authStore } from '$lib/stores/auth';

	interface Props {
		cart: Cart;
	}

	let { cart }: Props = $props();

	const quantity = $derived(cart.items.reduce((sum, item) => sum + item.quantity, 0));
</script>

<div class="bg-white rounded-lg shadow-md p-6">
	<h2 class="text-title text-ink mb-4">Итого</h2>

	<div class="flex items-baseline justify-between gap-3">
		<span class="text-gray-600">Товары, {quantity}&nbsp;шт.</span>
		<span class="text-price-md text-ink">
			{formatPrice($cartTotal, $storeSettings?.currency || 'RUB')}
		</span>
	</div>
	<p class="mt-2 mb-4 text-sm text-gray-500">
		Способ получения и промокод — на следующем шаге. Оплата при получении заказа.
	</p>

	<a
		href="/checkout"
		class="block w-full bg-blue-600 text-white text-center py-3 px-6 rounded-lg font-medium hover:bg-blue-700 transition-colors text-control-lg"
	>
		Оформить заказ
	</a>

	{#if !$authStore.isLoading && !$authStore.isAuthenticated}
		<p class="mt-3 text-sm text-gray-500">
			Для оформления понадобится войти или зарегистрироваться. Товары в корзине сохранятся.
		</p>
	{/if}
</div>
