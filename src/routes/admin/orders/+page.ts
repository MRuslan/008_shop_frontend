// Заказы магазина для админки: загрузка в браузере с токеном, фильтры и страница из адреса

import { ordersApi } from '$lib/api/orders';
import { hasAccessToken } from '$lib/api/client';
import type { Order } from '$lib/types/order';
import type { PageLoad } from './$types';

const PAGE_SIZE = 50;

export const load: PageLoad = async ({ url }) => {
	const filters = {
		status: url.searchParams.get('status') || '',
		dateFrom: url.searchParams.get('dateFrom') || '',
		dateTo: url.searchParams.get('dateTo') || ''
	};
	const page = Math.max(1, Number(url.searchParams.get('page')) || 1);
	const empty = { orders: [] as Order[], total: 0, page, limit: PAGE_SIZE, filters, failed: false };

	if (!hasAccessToken()) return empty;

	try {
		const result = await ordersApi.getAllOrders({ ...filters, page, limit: PAGE_SIZE });
		return { orders: result.data, total: result.total, page: result.page, limit: result.limit, filters, failed: false };
	} catch (error) {
		console.error('Failed to load orders:', error);
		return { ...empty, failed: true };
	}
};
