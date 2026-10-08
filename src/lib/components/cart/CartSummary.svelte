<script lang="ts">
	import type { Cart } from '$lib/types/cart';
	import { formatPrice } from '$lib/utils/format';
	import { storeSettings } from '$lib/stores/store';
	import { cartTotal } from '$lib/stores/cart';
	import { authStore } from '$lib/stores/auth';
	import { deliveryTerms } from '$lib/utils/delivery';

	interface Props {
		cart: Cart;
	}

	let { cart }: Props = $props();

	const quantity = $derived(cart.items.reduce((sum, item) => sum + item.quantity, 0));
	const currency = $derived($storeSettings?.currency || 'RUB');
	// Условия доставки видны до оформления: покупатель решает, добрать ли до бесплатной
	const delivery = $derived($storeSettings?.settings?.delivery);
	const deliveryNote = $derived(delivery?.enabled ? deliveryTerms(delivery, currency) : null);
</script>

<div class="rounded-2xl bg-surface p-5 md:p-6">
	<h2 class="text-title text-ink mb-4">Итого</h2>

	<div class="flex items-baseline justify-between gap-3">
		<span class="text-body text-gray-600">Товары, {quantity}&nbsp;шт.</span>
		<span class="text-price-md text-ink">
			{formatPrice($cartTotal, currency)}
		</span>
	</div>
	{#if deliveryNote}
		<p class="mt-2 text-body-sm text-gray-600">Доставка: {deliveryNote.charAt(0).toLowerCase() + deliveryNote.slice(1)}</p>
	{/if}
	<p class="mt-2 mb-5 text-body-sm text-gray-600">
		Способ получения и промокод — на следующем шаге. Оплата при получении заказа.
	</p>

	<a
		href="/checkout"
		class="btn-primary btn-lg w-full"
	>
		Оформить заказ
	</a>

	{#if !$authStore.isLoading && !$authStore.isAuthenticated}
		<p class="mt-3 text-body-sm text-gray-600">
			Для оформления понадобится войти или зарегистрироваться. Товары в корзине сохранятся.
		</p>
	{/if}
</div>
