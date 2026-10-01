// Письма о заказе ведут на {FRONTEND_URL}/orders/N (так строит ссылку бэкенд); страница заказа живёт в кабинете

import { redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = ({ params }) => {
	redirect(308, `/account/orders/${encodeURIComponent(params.id)}`);
};
