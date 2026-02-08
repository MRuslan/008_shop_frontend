// Server-side загрузка заказов для админ-панели

import { ordersApi } from '$lib/api/orders';

export async function load({ url }) {
	const status = url.searchParams.get('status') || undefined;
	const dateFrom = url.searchParams.get('dateFrom') || undefined;
	const dateTo = url.searchParams.get('dateTo') || undefined;

	try {
		const orders = await ordersApi.getAllOrders({
			status,
			dateFrom,
			dateTo
		});
		return {
			orders
		};
	} catch (error) {
		console.error('Failed to load orders:', error);
		return {
			orders: []
		};
	}
}
