// Базовый HTTP клиент для работы с API.
// В браузере запросы идут на свой сервер (/api): вход и гостевую корзину подставляет сервер SvelteKit
// из httpOnly-cookie (см. $lib/server/proxy). Токенов у страницы нет, украсть их скриптом нельзя

import { API_BASE_URL, ANONYMOUS_HEADER, SESSION_ENDED_HEADER } from '$lib/utils/constants';
import type { ApiError, PaginatedResponse } from '$lib/types/api';

export interface RequestOptions extends RequestInit {
	/** Без входа и гостевой корзины: публичные данные одинаковы для всех */
	skipAuth?: boolean;
	/**
	 * fetch из load. На сервере SvelteKit передаёт с ним cookie посетителя в свой /api,
	 * поэтому кабинет и админка рендерятся на сервере уже с данными
	 */
	fetch?: typeof fetch;
}

/** Для методов API, которые вызываются из load: `ordersApi.getMyOrders(query, { fetch })` */
export type LoadOptions = Pick<RequestOptions, 'fetch'>;

/** Событие окна: сервер витрины не смог продлить вход (сессию отозвали или она истекла) */
export const AUTH_EXPIRED_EVENT = 'auth:expired';

const PROXY_BASE = '/api';
const SERVER_TIMEOUT_MS = 8000;

class ApiClient {
	/**
	 * Выполняет запрос и разбирает ответ; ошибка бэкенда пробрасывается как ApiError
	 */
	async request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
		const { skipAuth = false, fetch: loadFetch, headers = {}, ...restOptions } = options;
		const onServer = typeof window === 'undefined';
		// Сервер без fetch из load — это загрузка публичной страницы: в бэкенд напрямую и без входа.
		// Иначе через свой /api, где сервер подставит вход посетителя
		const viaProxy = !onServer || loadFetch !== undefined;

		// Формируем заголовки. У FormData тип с границей multipart ставит сам браузер
		const isFormData = typeof FormData !== 'undefined' && restOptions.body instanceof FormData;
		const requestHeaders: Record<string, string> = {
			...(isFormData ? {} : { 'Content-Type': 'application/json' }),
			...(headers as Record<string, string>)
		};
		if (skipAuth && viaProxy) requestHeaders[ANONYMOUS_HEADER] = '1';

		// На сервере SvelteKit зависший бэкенд не должен вешать отрисовку страницы:
		// через 8 секунд запрос обрывается, и страница отвечает 503
		if (onServer && !restOptions.signal) {
			restOptions.signal = AbortSignal.timeout(SERVER_TIMEOUT_MS);
		}

		const response = await (loadFetch ?? fetch)(`${viaProxy ? PROXY_BASE : API_BASE_URL}${endpoint}`, {
			...restOptions,
			headers: requestHeaders
		});

		// Вход закончился на сервере: интерфейс должен перестать считать пользователя вошедшим
		if (!onServer && response.headers.get(SESSION_ENDED_HEADER)) {
			window.dispatchEvent(new CustomEvent(AUTH_EXPIRED_EVENT));
		}

		// Обрабатываем ответ
		if (!response.ok) {
			const error: ApiError = await response.json().catch(() => ({
				statusCode: response.status,
				message: response.statusText
			}));
			throw error;
		}

		// Если ответ пустой, возвращаем пустой объект
		const contentType = response.headers.get('content-type');
		if (!contentType || !contentType.includes('application/json')) {
			return {} as T;
		}

		return response.json();
	}

	/**
	 * GET запрос
	 */
	async get<T>(endpoint: string, options?: RequestOptions): Promise<T> {
		return this.request<T>(endpoint, { ...options, method: 'GET' });
	}

	/**
	 * POST запрос
	 */
	async post<T>(endpoint: string, data?: any, options?: RequestOptions): Promise<T> {
		return this.request<T>(endpoint, {
			...options,
			method: 'POST',
			body: data ? JSON.stringify(data) : undefined
		});
	}

	/**
	 * PATCH запрос
	 */
	async patch<T>(endpoint: string, data?: any, options?: RequestOptions): Promise<T> {
		return this.request<T>(endpoint, {
			...options,
			method: 'PATCH',
			body: data ? JSON.stringify(data) : undefined
		});
	}

	/**
	 * POST multipart/form-data, например загрузка файла
	 */
	async upload<T>(endpoint: string, data: FormData, options?: RequestOptions): Promise<T> {
		return this.request<T>(endpoint, { ...options, method: 'POST', body: data });
	}

	/**
	 * PUT запрос
	 */
	async put<T>(endpoint: string, data?: any, options?: RequestOptions): Promise<T> {
		return this.request<T>(endpoint, {
			...options,
			method: 'PUT',
			body: data ? JSON.stringify(data) : undefined
		});
	}

	/**
	 * DELETE запрос
	 */
	async delete<T>(endpoint: string, options?: RequestOptions): Promise<T> {
		return this.request<T>(endpoint, { ...options, method: 'DELETE' });
	}
}

/**
 * Все элементы постраничного списка: { data, total, page, limit } по 100 за запрос.
 * Старый формат (просто массив) тоже понимаем. maxPages ограничивает число запросов
 */
export async function fetchAllPages<T>(
	endpoint: string,
	options: RequestOptions = {},
	maxPages = 10
): Promise<T[]> {
	const separator = endpoint.includes('?') ? '&' : '?';
	const items: T[] = [];
	for (let page = 1; page <= maxPages; page++) {
		const response = await apiClient.get<PaginatedResponse<T> | T[]>(
			`${endpoint}${separator}page=${page}&limit=100`,
			options
		);
		if (Array.isArray(response)) return response;
		items.push(...response.data);
		if (items.length >= response.total || response.data.length === 0) break;
	}
	return items;
}

// Экспортируем singleton экземпляр
export const apiClient = new ApiClient();
