// Server-side загрузка деталей заказа

import { ordersApi } from '$lib/api/orders';
import { error } from '@sveltejs/kit';

export async function load({ params }) {
	const id = parseInt(params.id);

	if (isNaN(id)) {
		throw error(404, 'Заказ не найден');
	}

	try {
		const order = await ordersApi.getOrderById(id);
		return {
			order
		};
	} catch (err: any) {
		if (err.statusCode === 404 || err.statusCode === 403) {
			throw error(404, 'Заказ не найден');
		}
		throw error(500, 'Ошибка загрузки заказа');
	}
}
