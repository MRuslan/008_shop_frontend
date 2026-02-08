// Универсальная загрузка: купоны запрашиваются только на клиенте (нужен токен из localStorage)

import { browser } from '$app/environment';
import { couponsApi } from '$lib/api/coupons';

export async function load() {
	if (!browser) {
		return { coupons: [] };
	}
	try {
		const coupons = await couponsApi.getCoupons();
		return { coupons };
	} catch (error) {
		console.error('Failed to load coupons:', error);
		return { coupons: [] };
	}
}
