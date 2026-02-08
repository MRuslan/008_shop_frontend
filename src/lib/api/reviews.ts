// API методы для отзывов

import { apiClient } from './client';
import type { Review, CreateReviewDto } from '$lib/types/common';

export const reviewsApi = {
	/**
	 * Получить отзывы по товару
	 */
	async getReviewsByProduct(productId: number): Promise<Review[]> {
		return apiClient.get<Review[]>(`/reviews?productId=${productId}`, { skipAuth: true });
	},

	/**
	 * Добавить отзыв
	 */
	async createReview(data: CreateReviewDto): Promise<Review> {
		return apiClient.post<Review>('/reviews', data);
	},

	/**
	 * Удалить отзыв
	 */
	async deleteReview(id: number): Promise<void> {
		return apiClient.delete<void>(`/reviews/${id}`);
	},

	/**
	 * Модерация отзыва (для moderator/admin)
	 */
	async moderateReview(id: number, isVisible: boolean): Promise<Review> {
		return apiClient.patch<Review>(`/reviews/${id}/moderate`, { isVisible });
	}
};
