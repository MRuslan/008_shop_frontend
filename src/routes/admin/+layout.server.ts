// Админка только для сотрудников. Роль проверяем на сервере, до отрисовки: в токене её нет,
// поэтому спрашиваем пользователя у бэкенда (один раз за запрос, общий с корневым layout)

import { error, redirect } from '@sveltejs/kit';
import { currentVisitor } from '$lib/server/backend';

const STAFF_ROLES = ['admin', 'manager'];

export async function load(event) {
	const { signedIn, user } = await currentVisitor(event);
	if (!signedIn) {
		redirect(303, `/?redirect=${encodeURIComponent(event.url.pathname + event.url.search)}`);
	}
	// Вход есть, но бэкенд не ответил: роль неизвестна. Честная ошибка, а не отправка на вход
	if (!user) error(503, 'Не удалось проверить доступ: сервер магазина не ответил. Обновите страницу через минуту.');
	if (!STAFF_ROLES.includes(user.role)) redirect(303, '/');
}
