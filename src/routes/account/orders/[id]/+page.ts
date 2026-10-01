// Деталь заказа: загрузка в браузере с токеном

import { error } from '@sveltejs/kit';
import { ordersApi } from '$lib/api/orders';
import { hasAccessToken } from '$lib/api/client';
import { throwHttpError } from '$lib/utils/errors';
import type { PageLoad } from './$types';

export const load: PageLoad = async ({ params }) => {
	const id = Number.parseInt(params.id, 10);

	if (!Number.isInteger(id) || id <= 0) {
		error(404, 'Заказ не найден');
	}

	// Без входа layout кабинета отправит на вход; страницу заказа не рисуем
	if (!hasAccessToken()) return { order: null };

	// Чужой заказ (403) показываем как 404, чтобы не раскрывать его существование
	const order = await ordersApi
		.getOrderById(id)
		.catch((err) => throwHttpError(err, { notFound: 'Заказ не найден', forbiddenAsNotFound: true }));

	return { order };
};
