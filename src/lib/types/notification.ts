// Уведомления в приложении: хранит бэкенд, новые приходят потоком (SSE) через сервер витрины

export type NotificationSeverity = 'info' | 'success' | 'warning' | 'error';

/**
 * Покупателю: order.placed, order.status_changed. Сотрудникам: order.new, order.cancelled_by_customer,
 * stock.depleted; администратору ещё system.mail_failed.
 * Тексты (title, body) готовит бэкенд; тип нужен витрине для значков и живого обновления списков
 */
export interface AppNotification {
	id: number;
	type: string;
	title: string;
	body: string | null;
	/** Путь витрины: /account/orders/12, /admin/orders */
	link: string | null;
	severity: NotificationSeverity;
	data: { orderId?: number; productId?: number; locationId?: number; status?: string } | null;
	readAt: string | null;
	createAt: string;
}

export interface NotificationsPage {
	data: AppNotification[];
	total: number;
	page: number;
	limit: number;
	/** Непрочитанных всего, а не на этой странице */
	unread: number;
}
