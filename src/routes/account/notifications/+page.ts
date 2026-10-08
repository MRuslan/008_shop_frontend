// Уведомления: первая страница рендерится на сервере, дальше список ведёт store (живые события, «показать ещё»)

import { notificationsApi } from '$lib/api/notifications';
import { isApiError } from '$lib/utils/errors';
import type { NotificationsPage } from '$lib/types/notification';
import type { PageLoad } from './$types';

const PAGE_SIZE = 20;

export const load: PageLoad = async ({ fetch }) => {
	try {
		const page = await notificationsApi.getNotifications({ limit: PAGE_SIZE }, { fetch });
		return { initial: page, state: 'ok' as const };
	} catch (error) {
		// 404 — бэкенд ещё без уведомлений; иначе временный сбой
		const unavailable = isApiError(error) && error.statusCode === 404;
		return { initial: null as NotificationsPage | null, state: unavailable ? ('unavailable' as const) : ('failed' as const) };
	}
};
