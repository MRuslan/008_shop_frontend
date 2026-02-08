// API методы для избранного

import { apiClient } from './client';
import type { WishlistItem } from '$lib/types/common';

export const wishlistApi = {
	/**
	 * Получить список избранного
	 */
	async getWishlist(): Promise<WishlistItem[]> {
		return apiClient.get<WishlistItem[]>('/wishlist');
	},

	/**
	 * Добавить товар в избранное
	 */
	async addToWishlist(productId: number): Promise<WishlistItem> {
		return apiClient.post<WishlistItem>('/wishlist', { productId });
	},

	/**
	 * Удалить товар из избранного по productId
	 */
	async removeFromWishlist(productId: number): Promise<void> {
		return apiClient.delete<void>(`/wishlist/product/${productId}`);
	},

	/**
	 * Удалить позицию из избранного по id
	 */
	async removeWishlistItem(id: number): Promise<void> {
		return apiClient.delete<void>(`/wishlist/${id}`);
	}
};
