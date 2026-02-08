// Server-side загрузка заказов

import { ordersApi } from '$lib/api/orders';

export async function load() {
	try {
		const orders = await ordersApi.getMyOrders();
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
