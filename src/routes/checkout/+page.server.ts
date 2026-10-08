// Оформление только для вошедших. Гостя сервер сразу отправляет в корзину с окном входа,
// после входа он вернётся сюда (?redirect, см. Header). Товары гостя переедут в корзину аккаунта

import { redirect } from '@sveltejs/kit';

export function load({ locals }) {
	if (!locals.accessToken) redirect(303, '/cart?redirect=/checkout');
}
