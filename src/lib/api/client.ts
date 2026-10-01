// Базовый HTTP клиент для работы с API

import { API_BASE_URL, TOKEN_STORAGE_KEY, REFRESH_TOKEN_STORAGE_KEY } from '$lib/utils/constants';
import type { ApiError, PaginatedResponse } from '$lib/types/api';
import { getOrCreateSessionId } from '$lib/utils/session';

interface RequestOptions extends RequestInit {
	skipAuth?: boolean;
	useSessionId?: boolean;
}

/** Есть ли сохранённый вход. Только в браузере: на сервере токенов нет */
export function hasAccessToken(): boolean {
	return typeof window !== 'undefined' && !!localStorage.getItem(TOKEN_STORAGE_KEY);
}

/** Событие окна: обновить пару токенов не удалось, пользователь вышел */
export const AUTH_EXPIRED_EVENT = 'auth:expired';

class ApiClient {
	private baseUrl: string;
	/** Один обмен refresh-токена на вкладку: параллельные 401 ждут его, а не шлют свой */
	private refreshing: Promise<boolean> | null = null;

	constructor(baseUrl: string) {
		this.baseUrl = baseUrl;
	}

	/**
	 * Получает access token из localStorage
	 */
	private getAccessToken(): string | null {
		if (typeof window === 'undefined') return null;
		return localStorage.getItem(TOKEN_STORAGE_KEY);
	}

	/**
	 * Получает refresh token из localStorage
	 */
	private getRefreshToken(): string | null {
		if (typeof window === 'undefined') return null;
		return localStorage.getItem(REFRESH_TOKEN_STORAGE_KEY);
	}

	/**
	 * Сохраняет токены в localStorage
	 */
	private setTokens(accessToken: string, refreshToken: string): void {
		if (typeof window === 'undefined') return;
		localStorage.setItem(TOKEN_STORAGE_KEY, accessToken);
		localStorage.setItem(REFRESH_TOKEN_STORAGE_KEY, refreshToken);
	}

	/**
	 * Очищает токены
	 */
	private clearTokens(): void {
		if (typeof window === 'undefined') return;
		localStorage.removeItem(TOKEN_STORAGE_KEY);
		localStorage.removeItem(REFRESH_TOKEN_STORAGE_KEY);
	}

	/**
	 * Обновляет токены через refresh endpoint.
	 * Бэкенд считает повторный обмен одного refresh-токена кражей и отзывает сессию,
	 * поэтому обмен идёт строго по одному: внутри вкладки через общий промис,
	 * между вкладками через Web Locks. `staleToken` — access-токен, с которым пришёл 401:
	 * если за время ожидания его уже заменили, новый обмен не нужен.
	 */
	private refreshTokens(staleToken: string | null): Promise<boolean> {
		this.refreshing ??= this.withRefreshLock(() => this.exchangeRefreshToken(staleToken)).finally(() => {
			this.refreshing = null;
		});
		return this.refreshing;
	}

	private withRefreshLock(task: () => Promise<boolean>): Promise<boolean> {
		if (typeof navigator !== 'undefined' && navigator.locks) {
			// Типы lib.dom считают результат Promise<Promise<boolean>>; then разворачивает вложенный промис
			return navigator.locks.request('shop-auth-refresh', task).then((result) => result);
		}
		return task();
	}

	private async exchangeRefreshToken(staleToken: string | null): Promise<boolean> {
		const current = this.getAccessToken();
		if (current && current !== staleToken) return true;

		const refreshToken = this.getRefreshToken();
		if (!refreshToken) return false;

		try {
			const response = await fetch(`${this.baseUrl}/auth/refresh`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({ refresh_token: refreshToken })
			});

			if (response.ok) {
				const data = await response.json();
				this.setTokens(data.access_token, data.refresh_token);
				return true;
			}
			// Сессия отозвана или истекла: выходим, чтобы интерфейс не считал пользователя вошедшим
			this.clearTokens();
			window.dispatchEvent(new CustomEvent(AUTH_EXPIRED_EVENT));
			return false;
		} catch (error) {
			// Сеть недоступна: токены не трогаем, сессия ещё может быть жива
			console.error('Failed to refresh tokens:', error);
			return false;
		}
	}

	/**
	 * Выполняет запрос с автоматической обработкой токенов
	 */
	async request<T>(
		endpoint: string,
		options: RequestOptions = {}
	): Promise<T> {
		const { skipAuth = false, useSessionId = false, headers = {}, ...restOptions } = options;

		// Формируем заголовки. У FormData тип с границей multipart ставит сам браузер
		const isFormData = typeof FormData !== 'undefined' && restOptions.body instanceof FormData;
		const requestHeaders: Record<string, string> = {
			...(isFormData ? {} : { 'Content-Type': 'application/json' }),
			...(headers as Record<string, string>)
		};

		// Добавляем авторизацию
		const token = skipAuth ? null : this.getAccessToken();
		if (!skipAuth) {
			if (token) {
				requestHeaders['Authorization'] = `Bearer ${token}`;
			} else if (useSessionId) {
				// Для гостевой корзины используем sessionId
				const sessionId = getOrCreateSessionId();
				if (sessionId) {
					requestHeaders['X-Session-Id'] = sessionId;
				}
			}
		}

		// Выполняем запрос
		let response = await fetch(`${this.baseUrl}${endpoint}`, {
			...restOptions,
			headers: requestHeaders
		});

		// Если получили 401 на запрос с токеном, пробуем обновить токен
		if (response.status === 401 && token) {
			const refreshed = await this.refreshTokens(token);
			if (refreshed) {
				// Повторяем запрос с новым токеном
				const newToken = this.getAccessToken();
				if (newToken) {
					requestHeaders['Authorization'] = `Bearer ${newToken}`;
					response = await fetch(`${this.baseUrl}${endpoint}`, {
						...restOptions,
						headers: requestHeaders
					});
				}
			}
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
export const apiClient = new ApiClient(API_BASE_URL);
