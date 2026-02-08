// API методы для настроек магазина

import { apiClient } from './client';
import type { Store } from '$lib/types/common';

export const storeApi = {
	/**
	 * Получение настроек магазина
	 */
	async getStore(): Promise<Store> {
		return apiClient.get<Store>('/store', { skipAuth: true });
	}
};
