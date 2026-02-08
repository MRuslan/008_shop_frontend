// API методы для авторизации

import { apiClient } from './client';
import type {
	AuthResponse,
	User,
	RegisterDto,
	LoginDto,
	RefreshTokenDto,
	RefreshTokenResponse,
	DeleteAccountDto,
	UpdateRoleDto
} from '$lib/types/auth';

export const authApi = {
	/**
	 * Регистрация нового пользователя
	 */
	async register(data: RegisterDto): Promise<AuthResponse> {
		const response = await apiClient.post<AuthResponse>('/auth/register', data, {
			skipAuth: true
		});
		
		// Сохраняем токены
		if (typeof window !== 'undefined') {
			localStorage.setItem('access_token', response.access_token);
			localStorage.setItem('refresh_token', response.refresh_token);
		}
		
		return response;
	},

	/**
	 * Вход в систему
	 */
	async login(data: LoginDto): Promise<AuthResponse> {
		const response = await apiClient.post<AuthResponse>('/auth/login', data, {
			skipAuth: true
		});
		
		// Сохраняем токены
		if (typeof window !== 'undefined') {
			localStorage.setItem('access_token', response.access_token);
			localStorage.setItem('refresh_token', response.refresh_token);
		}
		
		return response;
	},

	/**
	 * Обновление токенов
	 */
	async refresh(data: RefreshTokenDto): Promise<RefreshTokenResponse> {
		const response = await apiClient.post<RefreshTokenResponse>('/auth/refresh', data, {
			skipAuth: true
		});
		
		// Сохраняем новые токены
		if (typeof window !== 'undefined') {
			localStorage.setItem('access_token', response.access_token);
			localStorage.setItem('refresh_token', response.refresh_token);
		}
		
		return response;
	},

	/**
	 * Получение текущего пользователя
	 */
	async getMe(): Promise<User> {
		return apiClient.get<User>('/auth/me');
	},

	/**
	 * Выход из системы
	 */
	async logout(): Promise<{ message: string }> {
		const response = await apiClient.post<{ message: string }>('/auth/logout');
		
		// Очищаем токены
		if (typeof window !== 'undefined') {
			localStorage.removeItem('access_token');
			localStorage.removeItem('refresh_token');
		}
		
		return response;
	},

	/**
	 * Удаление аккаунта
	 */
	async deleteAccount(data: DeleteAccountDto): Promise<{ message: string }> {
		// DELETE с body требует специальной обработки
		const response = await apiClient.request<{ message: string }>('/auth/account', {
			method: 'DELETE',
			body: JSON.stringify(data)
		});
		
		// Очищаем токены
		if (typeof window !== 'undefined') {
			localStorage.removeItem('access_token');
			localStorage.removeItem('refresh_token');
		}
		
		return response;
	},

	/**
	 * Смена роли пользователя (только для admin)
	 */
	async updateUserRole(userId: number, data: UpdateRoleDto): Promise<User> {
		return apiClient.patch<User>(`/auth/users/${userId}/role`, data);
	}
};
