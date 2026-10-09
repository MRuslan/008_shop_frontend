// API статистики магазина (для admin/manager)

import { apiClient, type LoadOptions } from './client';
import type { AdminStats } from '$lib/types/stats';

export const statsApi = {
	/**
	 * Сводка за период: даты YYYY-MM-DD включительно, в часовом поясе магазина
	 */
	async getAdminStats(query: { from: string; to: string; lowStock?: number }, options: LoadOptions = {}): Promise<AdminStats> {
		const params = new URLSearchParams({ from: query.from, to: query.to });
		if (query.lowStock) params.set('lowStock', String(query.lowStock));
		return apiClient.get<AdminStats>(`/admin/stats?${params}`, options);
	}
};
