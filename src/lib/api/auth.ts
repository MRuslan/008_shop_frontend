// API методы для авторизации.
// Вход, регистрация и выход идут через сервер витрины: он кладёт токены в httpOnly-cookie
// и отдаёт браузеру только пользователя (см. $lib/server/proxy)

import { apiClient } from './client';
import type {
	SignInResponse,
	User,
	RegisterDto,
	LoginDto,
	DeleteAccountDto,
	UpdateRoleDto,
	PendingEmailChange
} from '$lib/types/auth';

export const authApi = {
	/**
	 * Регистрация нового пользователя: сразу и вход
	 */
	async register(data: RegisterDto): Promise<SignInResponse> {
		return apiClient.post<SignInResponse>('/auth/register', data);
	},

	/**
	 * Вход в систему. Гостевая корзина переезжает в корзину аккаунта на сервере
	 */
	async login(data: LoginDto): Promise<SignInResponse> {
		return apiClient.post<SignInResponse>('/auth/login', data);
	},

	/**
	 * Получение текущего пользователя
	 */
	async getMe(): Promise<User> {
		return apiClient.get<User>('/auth/me');
	},

	/**
	 * Выход: бэкенд отзывает сессию, сервер витрины стирает cookie
	 */
	async logout(): Promise<{ message: string }> {
		return apiClient.post<{ message: string }>('/auth/logout');
	},

	/**
	 * Удаление аккаунта. Сессия после него недействительна: вызывающий выходит (authStore.logout)
	 */
	async deleteAccount(data: DeleteAccountDto): Promise<{ message: string }> {
		// DELETE с body требует специальной обработки
		return apiClient.request<{ message: string }>('/auth/account', {
			method: 'DELETE',
			body: JSON.stringify(data)
		});
	},

	/**
	 * Письмо со ссылкой восстановления. Ответ одинаковый для любого email,
	 * чтобы по нему нельзя было узнать, зарегистрирован ли адрес
	 */
	async forgotPassword(email: string): Promise<{ message: string }> {
		return apiClient.post<{ message: string }>('/auth/forgot-password', { email }, { skipAuth: true });
	},

	/**
	 * Новый пароль по токену из письма. Все сессии пользователя отзываются: войти нужно заново
	 */
	async resetPassword(token: string, newPassword: string): Promise<{ message: string }> {
		return apiClient.post<{ message: string }>(
			'/auth/reset-password',
			{ token, newPassword },
			{ skipAuth: true }
		);
	},

	/**
	 * Смена пароля: текущая сессия остаётся, остальные устройства выходят
	 */
	async changePassword(
		currentPassword: string,
		newPassword: string
	): Promise<{ message: string; revokedSessions: number }> {
		return apiClient.post('/auth/change-password', { currentPassword, newPassword });
	},

	/**
	 * Сменить email: на новый адрес уходит ссылка подтверждения. До перехода по ней вход по прежнему адресу.
	 * Повторный вызов (и на тот же адрес) заменяет прежнюю заявку, старая ссылка гаснет
	 */
	async changeEmail(newEmail: string, password: string): Promise<PendingEmailChange & { message: string }> {
		return apiClient.post('/auth/change-email', { newEmail, password });
	},

	/**
	 * Ожидающая смена email для профиля; просроченная приходит как null
	 */
	async getEmailChange(): Promise<PendingEmailChange> {
		return apiClient.get<PendingEmailChange>('/auth/change-email');
	},

	/**
	 * Отменить ожидающую смену email: ссылка из письма перестаёт работать
	 */
	async cancelEmailChange(): Promise<{ message: string }> {
		return apiClient.delete<{ message: string }>('/auth/change-email');
	},

	/**
	 * Подтвердить новый email по токену из письма. Вход не нужен: ссылку могут открыть в другом браузере
	 */
	async confirmEmail(token: string): Promise<{ message: string; email: string }> {
		return apiClient.post('/auth/confirm-email', { token }, { skipAuth: true });
	},

	/**
	 * Изменить своё имя (email и роль так не меняются)
	 */
	async updateProfile(username: string): Promise<User> {
		return apiClient.patch<User>('/users/me', { username });
	},

	/**
	 * Смена роли пользователя (только для admin)
	 */
	async updateUserRole(userId: number, data: UpdateRoleDto): Promise<User> {
		return apiClient.patch<User>(`/auth/users/${userId}/role`, data);
	}
};
