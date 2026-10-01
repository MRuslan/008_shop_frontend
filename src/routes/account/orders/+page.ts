// Свои заказы: загрузка в браузере с токеном, постранично

import { ordersApi } from '$lib/api/orders';
import { hasAccessToken } from '$lib/api/client';
import type { Order } from '$lib/types/order';
import type { PageLoad } from './$types';

const PAGE_SIZE = 20;

export const load: PageLoad = async ({ url }) => {
	const page = Math.max(1, Number(url.searchParams.get('page')) || 1);
	const empty = { orders: [] as Order[], total: 0, page, limit: PAGE_SIZE, failed: false };

	// Без входа грузить нечего: layout кабинета сам отправит на вход
	if (!hasAccessToken()) return empty;

	try {
		const result = await ordersApi.getMyOrders({ page, limit: PAGE_SIZE });
		return { orders: result.data, total: result.total, page: result.page, limit: result.limit, failed: false };
	} catch (error) {
		console.error('Failed to load orders:', error);
		return { ...empty, failed: true };
	}
};
