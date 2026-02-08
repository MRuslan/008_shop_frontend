// Server-side проверка авторизации для личного кабинета

import { redirect } from '@sveltejs/kit';

export async function load({ cookies, url }) {
	// Проверка авторизации происходит на клиенте через authStore
	// На сервере просто возвращаем пустые данные
	// Если нужно, можно добавить проверку через cookies
	return {};
}
