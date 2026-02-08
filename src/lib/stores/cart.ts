// Store для управления корзиной

import { writable, derived } from 'svelte/store';
import type { Cart } from '$lib/types/cart';

function createCartStore() {
	const { subscribe, set, update } = writable<Cart | null>(null);

	return {
		subscribe,

		/**
		 * Установка корзины
		 */
		setCart(cart: Cart) {
			set(cart);
		},

		/**
		 * Очистка корзины
		 */
		clear() {
			set(null);
		},

		/**
		 * Обновление количества товара в корзине
		 */
		updateItemQuantity(itemId: number, quantity: number) {
			update((cart) => {
				if (!cart) return cart;
				
				const item = cart.items.find((i) => i.id === itemId);
				if (item) {
					item.quantity = quantity;
				}
				
				return cart;
			});
		},

		/**
		 * Удаление товара из корзины
		 */
		removeItem(itemId: number) {
			update((cart) => {
				if (!cart) return cart;
				
				return {
					...cart,
					items: cart.items.filter((i) => i.id !== itemId)
				};
			});
		}
	};
}

export const cartStore = createCartStore();

/**
 * Общее количество товаров в корзине
 */
export const cartItemsCount = derived(cartStore, ($cart) => {
	if (!$cart) return 0;
	return $cart.items.reduce((sum, item) => sum + item.quantity, 0);
});

/**
 * Общая сумма корзины
 */
export const cartTotal = derived(cartStore, ($cart) => {
	if (!$cart) return '0';
	return $cart.items.reduce((sum, item) => {
		const price = parseFloat(item.product.price);
		return sum + price * item.quantity;
	}, 0).toFixed(2);
});
