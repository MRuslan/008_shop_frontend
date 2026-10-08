// Store для управления корзиной.
// Корзину посетителя (вошедшего — по входу, гостя — по cookie гостевой корзины) отдаёт корневой layout,
// дальше store меняется на месте при каждом действии с корзиной

import { writable, derived } from 'svelte/store';
import { cartApi } from '$lib/api/cart';
import type { Cart } from '$lib/types/cart';

/**
 * Корзина пришла с сервера (или не смогла). До этого страницы показывают заглушку, а не «пустую корзину».
 * После SSR это верно с первого рендера; ложно только на страницах ошибки без корневых данных
 */
export const cartReady = writable(false);

function createCartStore() {
	const { subscribe, set } = writable<Cart | null>(null);

	return {
		subscribe,

		/**
		 * Корзина с сервера (корневой layout): при SSR, первом рендере и после повторной загрузки.
		 * null — не загрузилась (пустую корзину бэкенд отдаёт с пустым items)
		 */
		hydrate(cart: Cart | null) {
			set(cart);
			cartReady.set(true);
		},

		/**
		 * Положить товар в корзину. Ошибку (например, нехватку остатка) пробрасываем вызывающему
		 */
		async add(productId: number, quantity = 1) {
			const cart = await cartApi.addItem({ productId, quantity });
			set(cart);
			return cart;
		},

		/**
		 * Изменить количество позиции; ноль убирает позицию из корзины
		 */
		async setQuantity(itemId: number, quantity: number) {
			const cart =
				quantity > 0 ? await cartApi.updateItem(itemId, { quantity }) : await cartApi.removeItem(itemId);
			set(cart);
			return cart;
		},

		/**
		 * Перечитать корзину: остатки и цены могли измениться. При сбое остаётся прежняя корзина
		 */
		async reload() {
			try {
				set(await cartApi.getCart());
			} catch (error) {
				console.error('Failed to load cart:', error);
			} finally {
				cartReady.set(true);
			}
		},

		/**
		 * Установка корзины из ответа API
		 */
		setCart(cart: Cart) {
			set(cart);
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
 * Позиции корзины по id товара: карточки узнают, лежит ли товар в корзине и в каком количестве
 */
export const cartLines = derived(cartStore, ($cart) => {
	const lines = new Map<number, { itemId: number; quantity: number }>();
	for (const item of $cart?.items ?? []) {
		lines.set(item.productId, { itemId: item.id, quantity: item.quantity });
	}
	return lines;
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
