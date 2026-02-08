// Базовый HTTP клиент для работы с API

import { API_BASE_URL, TOKEN_STORAGE_KEY, REFRESH_TOKEN_STORAGE_KEY } from '$lib/utils/constants';
import type { ApiError } from '$lib/types/api';
import { getOrCreateSessionId } from '$lib/utils/session';

interface RequestOptions extends RequestInit {
	skipAuth?: boolean;
	useSessionId?: boolean;
}

class ApiClient {
	private baseUrl: string;

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
	 * Обновляет токены через refresh endpoint
	 */
	private async refreshTokens(): Promise<boolean> {
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
			} else {
				this.clearTokens();
				return false;
			}
		} catch (error) {
			console.error('Failed to refresh tokens:', error);
			this.clearTokens();
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

		// Формируем заголовки
		const requestHeaders: HeadersInit = {
			'Content-Type': 'application/json',
			...headers
		};

		// Добавляем авторизацию
		if (!skipAuth) {
			const token = this.getAccessToken();
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

		// Если получили 401, пробуем обновить токен
		if (response.status === 401 && !skipAuth && !useSessionId) {
			const refreshed = await this.refreshTokens();
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
	 * DELETE запрос
	 */
	async delete<T>(endpoint: string, options?: RequestOptions): Promise<T> {
		return this.request<T>(endpoint, { ...options, method: 'DELETE' });
	}
}

// Экспортируем singleton экземпляр
export const apiClient = new ApiClient(API_BASE_URL);
