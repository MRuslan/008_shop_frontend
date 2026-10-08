// API методы для корзины. Чья корзина — вошедшего или гостя — решает сервер витрины по cookie

import { apiClient, type LoadOptions } from './client';
import type { Cart, AddCartItemDto, UpdateCartItemDto, CartAvailability } from '$lib/types/cart';

export const cartApi = {
	/**
	 * Получить корзину
	 */
	async getCart(options: LoadOptions = {}): Promise<Cart> {
		return apiClient.get<Cart>('/cart', options);
	},

	/**
	 * Добавить товар в корзину
	 */
	async addItem(data: AddCartItemDto): Promise<Cart> {
		return apiClient.post<Cart>('/cart/items', data);
	},

	/**
	 * Изменить количество товара в корзине
	 */
	async updateItem(itemId: number, data: UpdateCartItemDto): Promise<Cart> {
		return apiClient.patch<Cart>(`/cart/items/${itemId}`, data);
	},

	/**
	 * Удалить товар из корзины
	 */
	async removeItem(itemId: number): Promise<Cart> {
		return apiClient.delete<Cart>(`/cart/items/${itemId}`);
	},

	/**
	 * Очистить корзину
	 */
	async clearCart(): Promise<Cart> {
		return apiClient.delete<Cart>('/cart');
	},

	/**
	 * Где корзину можно забрать целиком и хватит ли её на доставку (без резерва)
	 */
	async getAvailability(options: LoadOptions = {}): Promise<CartAvailability> {
		return apiClient.get<CartAvailability>('/cart/availability', options);
	}
};
