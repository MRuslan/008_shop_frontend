// API методы для корзины

import { apiClient } from './client';
import type { Cart, AddCartItemDto, UpdateCartItemDto, MergeSessionDto } from '$lib/types/cart';

export const cartApi = {
	/**
	 * Получить корзину
	 */
	async getCart(useSessionId: boolean = false): Promise<Cart> {
		return apiClient.get<Cart>('/cart', { useSessionId });
	},

	/**
	 * Добавить товар в корзину
	 */
	async addItem(data: AddCartItemDto, useSessionId: boolean = false): Promise<Cart> {
		return apiClient.post<Cart>('/cart/items', data, { useSessionId });
	},

	/**
	 * Изменить количество товара в корзине
	 */
	async updateItem(itemId: number, data: UpdateCartItemDto, useSessionId: boolean = false): Promise<Cart> {
		return apiClient.patch<Cart>(`/cart/items/${itemId}`, data, { useSessionId });
	},

	/**
	 * Удалить товар из корзины
	 */
	async removeItem(itemId: number, useSessionId: boolean = false): Promise<Cart> {
		return apiClient.delete<Cart>(`/cart/items/${itemId}`, { useSessionId });
	},

	/**
	 * Очистить корзину
	 */
	async clearCart(useSessionId: boolean = false): Promise<Cart> {
		return apiClient.delete<Cart>('/cart', { useSessionId });
	},

	/**
	 * Слияние гостевой корзины с корзиной пользователя
	 */
	async mergeSession(data: MergeSessionDto): Promise<Cart> {
		return apiClient.post<Cart>('/cart/merge-session', data);
	}
};
