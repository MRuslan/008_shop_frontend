// Server-side проверка авторизации для страницы оформления заказа

import { redirect } from '@sveltejs/kit';

export async function load({ cookies }) {
	// Проверка авторизации происходит на клиенте через authStore
	// На сервере просто возвращаем пустые данные
	return {};
}
