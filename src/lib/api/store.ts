// API методы для настроек магазина

import { apiClient } from './client';
import type { Store } from '$lib/types/common';

export const storeApi = {
	/**
	 * Получение настроек магазина
	 */
	async getStore(): Promise<Store> {
		return apiClient.get<Store>('/store', { skipAuth: true });
	},

	/**
	 * Создать магазин (для admin)
	 */
	async createStore(data: Partial<Store>): Promise<Store> {
		return apiClient.post<Store>('/store', data);
	},

	/**
	 * Обновить текущий магазин (для admin)
	 */
	async updateStore(data: Partial<Store>): Promise<Store> {
		return apiClient.patch<Store>('/store', data);
	},

	/**
	 * Обновить магазин по ID (для admin)
	 */
	async updateStoreById(id: number, data: Partial<Store>): Promise<Store> {
		return apiClient.patch<Store>(`/store/${id}`, data);
	}
};
