// Server-side загрузка точек продаж для админ-панели

import { locationsApi } from '$lib/api/locations';

export async function load() {
	try {
		const locations = await locationsApi.getLocations({ isActive: undefined });
		return {
			locations
		};
	} catch (error) {
		console.error('Failed to load locations:', error);
		return {
			locations: []
		};
	}
}
