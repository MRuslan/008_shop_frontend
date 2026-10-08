// Админка только для сотрудников. Роль проверяем на сервере, до отрисовки: в токене её нет,
// поэтому спрашиваем пользователя у бэкенда (один раз за запрос, общий с корневым layout)

import { redirect } from '@sveltejs/kit';
import { currentUser } from '$lib/server/backend';

const STAFF_ROLES = ['admin', 'manager'];

export async function load(event) {
	const user = await currentUser(event);
	if (!user) {
		redirect(303, `/?redirect=${encodeURIComponent(event.url.pathname + event.url.search)}`);
	}
	if (!STAFF_ROLES.includes(user.role)) redirect(303, '/');
}
