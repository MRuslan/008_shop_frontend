// Store уведомлений вошедшего пользователя. Список отдаёт бэкенд, новые приходят потоком (SSE)
// через сервер витрины: в момент события — тост и значок на колокольчике, открытый список заказов обновляется

import { writable, derived, get } from 'svelte/store';
import { browser } from '$app/environment';
import { goto, invalidate } from '$app/navigation';
import { notificationsApi, NOTIFICATIONS_STREAM_URL } from '$lib/api/notifications';
import type { AppNotification } from '$lib/types/notification';
import { isApiError } from '$lib/utils/errors';
import { ORDERS_DEPENDENCY } from '$lib/utils/constants';
import { authStore } from './auth';
import { toast } from './toast';

interface NotificationsState {
	/** Бэкенд умеет уведомления; false после ответа 404 */
	available: boolean;
	/** Первая страница загружена */
	loaded: boolean;
	/** Новые сверху: первая страница, живые события и догруженные страницы */
	items: AppNotification[];
	/** Непрочитанных всего, а не только среди загруженных */
	unread: number;
	/** Всего уведомлений: есть ли что догружать */
	total: number;
}

const PAGE_SIZE = 20;
/** Поток не открылся (сеть, перезапуск бэкенда): пробуем снова через полминуты */
const RECONNECT_MS = 30_000;

const INITIAL: NotificationsState = { available: true, loaded: false, items: [], unread: 0, total: 0 };

function createNotificationsStore() {
	const state = writable<NotificationsState>(INITIAL);
	let source: EventSource | null = null;
	let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
	let activeUserId: number | null = null;
	let active = false;
	let pagesLoaded = 0;

	async function refresh(): Promise<void> {
		try {
			const page = await notificationsApi.getNotifications({ limit: PAGE_SIZE });
			pagesLoaded = 1;
			state.set({ available: true, loaded: true, items: page.data, unread: page.unread, total: page.total });
		} catch (error) {
			// 404: бэкенд ещё без уведомлений. Колокольчик показывает это, поток не открываем
			if (isApiError(error) && error.statusCode === 404) {
				state.set({ ...INITIAL, available: false, loaded: true });
				disconnect();
			}
		}
	}

	function showToast(notification: AppNotification) {
		const message = notification.body ? `${notification.title}. ${notification.body}` : notification.title;
		const link = notification.link;
		const action = link
			? {
					label: 'Открыть',
					onClick: () => {
						void markRead(notification.id);
						void goto(link);
					}
				}
			: undefined;
		if (notification.severity === 'error') toast.error(message, { action });
		else if (notification.severity === 'success') toast.success(message, { action });
		else toast.info(message, { action, duration: 8000 });
	}

	function receive(notification: AppNotification) {
		if (get(state).items.some((item) => item.id === notification.id)) return;
		state.update((current) => ({
			...current,
			available: true,
			items: [notification, ...current.items],
			unread: current.unread + (notification.readAt ? 0 : 1),
			total: current.total + 1
		}));
		// В каждой открытой вкладке свой поток: тост только в той, что перед глазами
		if (document.visibilityState === 'visible') showToast(notification);
		// Новый заказ или смена статуса: список заказов на экране устарел
		if (notification.data?.orderId) void invalidate(ORDERS_DEPENDENCY);
	}

	function disconnect() {
		source?.close();
		source = null;
		if (reconnectTimer) {
			clearTimeout(reconnectTimer);
			reconnectTimer = null;
		}
	}

	function connect() {
		disconnect();
		if (!active || !get(state).available) return;
		const stream = new EventSource(NOTIFICATIONS_STREAM_URL);
		source = stream;
		let openedBefore = false;

		stream.addEventListener('open', () => {
			// Переподключение после обрыва: за это время могли прийти уведомления
			if (openedBefore) void refresh();
			openedBefore = true;
		});
		stream.addEventListener('notification', (event) => {
			try {
				receive(JSON.parse((event as MessageEvent<string>).data));
			} catch {
				// Битое событие пропускаем: следующий refresh всё равно сверит список
			}
		});
		stream.addEventListener('error', () => {
			// Обрыв живого потока EventSource переподключит сам. Ошибочный ответ (401, 404, 503) закрывает его
			// насовсем: тогда сверяем список (он же узнает об окончании входа) и пробуем позже
			if (stream.readyState !== EventSource.CLOSED || source !== stream) return;
			source = null;
			reconnectTimer = setTimeout(async () => {
				reconnectTimer = null;
				await refresh();
				connect();
			}, RECONNECT_MS);
		});
	}

	async function start() {
		active = true;
		pagesLoaded = 0;
		state.set(INITIAL);
		await refresh();
		connect();
	}

	function stop() {
		active = false;
		activeUserId = null;
		pagesLoaded = 0;
		disconnect();
		state.set(INITIAL);
	}

	async function markRead(id: number) {
		const item = get(state).items.find((candidate) => candidate.id === id);
		if (!item || item.readAt) return;
		const readAt = new Date().toISOString();
		state.update((current) => ({
			...current,
			items: current.items.map((candidate) => (candidate.id === id ? { ...candidate, readAt } : candidate)),
			unread: Math.max(0, current.unread - 1)
		}));
		try {
			await notificationsApi.markRead(id);
		} catch {
			await refresh();
		}
	}

	if (browser) {
		authStore.subscribe(($auth) => {
			if (!$auth.isAuthenticated) {
				if (active) stop();
				return;
			}
			const userId = $auth.user?.id ?? null;
			// Вошёл другой пользователь: его уведомления, а не прежние
			if (active && userId !== null && activeUserId !== null && userId !== activeUserId) stop();
			if (userId !== null) activeUserId = userId;
			if (!active) void start();
		});
	}

	return {
		subscribe: state.subscribe,
		markRead,

		async markAllRead() {
			const readAt = new Date().toISOString();
			state.update((current) => ({
				...current,
				items: current.items.map((item) => (item.readAt ? item : { ...item, readAt })),
				unread: 0
			}));
			try {
				await notificationsApi.markAllRead();
			} catch {
				await refresh();
			}
		},

		/** Прочитать загруженные непрочитанные, подходящие под условие: например, новые заказы на странице заказов */
		async markReadWhere(match: (notification: AppNotification) => boolean) {
			const ids = get(state)
				.items.filter((item) => !item.readAt && match(item))
				.map((item) => item.id);
			await Promise.all(ids.map((id) => markRead(id)));
		},

		/** Следующая страница для полного списка; false — не загрузилась */
		async loadMore(): Promise<boolean> {
			try {
				const page = await notificationsApi.getNotifications({ page: pagesLoaded + 1, limit: PAGE_SIZE });
				pagesLoaded += 1;
				state.update((current) => {
					const known = new Set(current.items.map((item) => item.id));
					return {
						...current,
						items: [...current.items, ...page.data.filter((item) => !known.has(item.id))],
						unread: page.unread,
						total: page.total
					};
				});
				return true;
			} catch {
				return false;
			}
		}
	};
}

export const notifications = createNotificationsStore();

/**
 * Новые заказы магазина, о которых сотрудник ещё не прочитал: значок у раздела «Заказы» в админке.
 * Покупателю о его собственном заказе приходит другой тип — order.placed
 */
export const isNewShopOrder = (item: AppNotification) => item.type === 'order.new';

export const unreadNewOrders = derived(
	notifications,
	($notifications) => $notifications.items.filter((item) => !item.readAt && isNewShopOrder(item)).length
);
