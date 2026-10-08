// Купоны для админки. При SSR запрос идёт через свой /api с cookie сотрудника

import { couponsApi } from '$lib/api/coupons';
import type { Coupon } from '$lib/types/common';
import type { PageLoad } from './$types';

export const load: PageLoad = async ({ fetch }) => {
	try {
		const coupons = await couponsApi.getCoupons({ fetch });
		return { coupons };
	} catch (error) {
		console.error('Failed to load coupons:', error);
		return { coupons: [] as Coupon[] };
	}
};
