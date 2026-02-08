// Server-side загрузка купонов для админ-панели

import { couponsApi } from '$lib/api/coupons';

export async function load() {
	try {
		const coupons = await couponsApi.getCoupons();
		return {
			coupons
		};
	} catch (error) {
		console.error('Failed to load coupons:', error);
		return {
			coupons: []
		};
	}
}
