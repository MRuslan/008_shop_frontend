// API методы для уведомлений

import { apiClient, type LoadOptions } from './client';
import type { AppNotification, NotificationsPage } from '$lib/types/notification';

export const notificationsApi = {
	/**
	 * Уведомления текущего пользователя, новые сверху; unread — непрочитанных всего
	 */
	async getNotifications(query: { page?: number; limit?: number } = {}, options: LoadOptions = {}): Promise<NotificationsPage> {
		const params = new URLSearchParams();
		if (query.page && query.page > 1) params.set('page', String(query.page));
		if (query.limit) params.set('limit', String(query.limit));
		const search = params.toString();
		return apiClient.get<NotificationsPage>(`/notifications${search ? `?${search}` : ''}`, options);
	},

	async markRead(id: number): Promise<AppNotification> {
		return apiClient.patch<AppNotification>(`/notifications/${id}/read`);
	},

	async markAllRead(): Promise<{ updated: number }> {
		return apiClient.post<{ updated: number }>('/notifications/read-all');
	}
};

/** Поток новых уведомлений: EventSource на свой сервер, он подставит вход (см. routes/api/notifications/stream) */
export const NOTIFICATIONS_STREAM_URL = '/api/notifications/stream';
