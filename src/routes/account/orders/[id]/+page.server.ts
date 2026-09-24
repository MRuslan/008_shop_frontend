// Server-side загрузка деталей заказа

import { error } from '@sveltejs/kit';
import { ordersApi } from '$lib/api/orders';
import { throwHttpError } from '$lib/utils/errors';

export async function load({ params }) {
	const id = Number.parseInt(params.id, 10);

	if (!Number.isInteger(id) || id <= 0) {
		error(404, 'Заказ не найден');
	}

	// Чужой заказ (403) показываем как 404, чтобы не раскрывать его существование
	const order = await ordersApi
		.getOrderById(id)
		.catch((err) => throwHttpError(err, { notFound: 'Заказ не найден', forbiddenAsNotFound: true }));

	return { order };
}
