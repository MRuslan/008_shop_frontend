// Кабинет только для вошедших. Проверка на сервере, до отрисовки: гость сразу попадает на главную
// с окном входа и после входа вернётся сюда (?redirect, см. Header)

import { redirect } from '@sveltejs/kit';

export function load({ locals, url }) {
	// Токен проверит бэкенд на первом же запросе данных; если сессия уже отозвана,
	// браузер получит заголовок об окончании входа и перечитает данные (см. stores/auth)
	if (!locals.accessToken) {
		redirect(303, `/?redirect=${encodeURIComponent(url.pathname + url.search)}`);
	}
}
