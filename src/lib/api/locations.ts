// API методы для точек продаж

import { apiClient } from './client';
import type { Location } from '$lib/types/order';

export interface LocationsQuery {
	storeId?: number;
	isActive?: boolean;
}

export const locationsApi = {
	/**
	 * Получить список точек продаж
	 */
	async getLocations(query?: LocationsQuery): Promise<Location[]> {
		const params = new URLSearchParams();
		if (query?.storeId) params.append('storeId', query.storeId.toString());
		if (query?.isActive !== undefined) params.append('isActive', query.isActive.toString());

		const queryString = params.toString();
		const endpoint = queryString ? `/locations?${queryString}` : '/locations';
		
		return apiClient.get<Location[]>(endpoint, { skipAuth: true });
	},

	/**
	 * Получить точку продаж по ID
	 */
	async getLocationById(id: number): Promise<Location> {
		return apiClient.get<Location>(`/locations/${id}`, { skipAuth: true });
	}
};
