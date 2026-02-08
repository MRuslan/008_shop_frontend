// Store для управления корзиной

import { writable, derived } from 'svelte/store';
import { browser } from '$app/environment';
import { cartApi } from '$lib/api/cart';
import { authStore } from './auth';
import { getOrCreateSessionId } from '$lib/utils/session';
import type { Cart } from '$lib/types/cart';

function createCartStore() {
	const { subscribe, set, update } = writable<Cart | null>(null);

	return {
		subscribe,

		/**
		 * Инициализация: загрузка корзины
		 */
		async init() {
			if (!browser) return;

			try {
				// Получаем текущее состояние авторизации
				let authState: { isAuthenticated: boolean } = { isAuthenticated: false };
				const unsubscribe = authStore.subscribe((auth) => {
					authState = auth;
				});
				unsubscribe();

				const useSessionId = !authState.isAuthenticated;
				const cart = await cartApi.getCart(useSessionId);
				set(cart);
			} catch (error) {
				console.error('Failed to load cart:', error);
				set(null);
			}
		},

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
		},

		/**
		 * Слияние гостевой корзины с корзиной пользователя
		 */
		async mergeGuestCart() {
			if (!browser) return;

			const sessionId = getOrCreateSessionId();
			if (!sessionId) return;

			try {
				const cart = await cartApi.mergeSession({ sessionId });
				set(cart);
			} catch (error) {
				console.error('Failed to merge guest cart:', error);
			}
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
