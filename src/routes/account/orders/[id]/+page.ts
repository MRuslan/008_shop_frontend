// Деталь заказа. При SSR запрос идёт через свой /api с cookie посетителя

import { error } from '@sveltejs/kit';
import { ordersApi } from '$lib/api/orders';
import { throwHttpError } from '$lib/utils/errors';
import type { PageLoad } from './$types';

export const load: PageLoad = async ({ params, fetch }) => {
	const id = Number.parseInt(params.id, 10);

	if (!Number.isInteger(id) || id <= 0) {
		error(404, 'Заказ не найден');
	}

	// Чужой заказ (403) показываем как 404, чтобы не раскрывать его существование
	const order = await ordersApi
		.getOrderById(id, { fetch })
		.catch((err) => throwHttpError(err, { notFound: 'Заказ не найден', forbiddenAsNotFound: true }));

	return { order };
};
