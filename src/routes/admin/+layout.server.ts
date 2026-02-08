// Server-side проверка ролей для админ-панели

import { redirect } from '@sveltejs/kit';

export async function load({ cookies }) {
	// Проверка ролей происходит на клиенте через authStore
	// На сервере просто возвращаем пустые данные
	return {};
}
