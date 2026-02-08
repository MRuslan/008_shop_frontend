// Server-side загрузка настроек магазина для админ-панели

import { storeApi } from '$lib/api/store';

export async function load() {
	try {
		const store = await storeApi.getStore();
		return {
			store
		};
	} catch (error) {
		console.error('Failed to load store:', error);
		return {
			store: null
		};
	}
}
