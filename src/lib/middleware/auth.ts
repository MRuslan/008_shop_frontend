// Middleware для проверки авторизации на сервере

import { redirect } from '@sveltejs/kit';
import type { RequestEvent } from '@sveltejs/kit';

/**
 * Проверяет, авторизован ли пользователь
 * Используется в +page.server.ts для защищённых страниц
 */
export async function requireAuth(event: RequestEvent): Promise<void> {
	// В SvelteKit проверка токена на сервере требует cookies или headers
	// Для простоты проверяем наличие токена в cookies (если используем httpOnly cookies)
	// Или проверяем на клиенте через store
	
	// Здесь можно добавить проверку токена из cookies
	// const token = event.cookies.get('access_token');
	// if (!token) {
	//   throw redirect(302, '/login');
	// }
	
	// Пока проверка будет на клиенте через stores
}

/**
 * Проверяет роль пользователя
 */
export async function requireRole(
	event: RequestEvent,
	roles: string[]
): Promise<void> {
	// Аналогично requireAuth, но с проверкой роли
	// Реализация зависит от того, как передаются данные пользователя на сервер
}
