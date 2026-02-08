// Store для управления состоянием авторизации

import { writable, derived, get } from 'svelte/store';
import { browser } from '$app/environment';
import { authApi } from '$lib/api/auth';
import type { User, Role } from '$lib/types/auth';
import { TOKEN_STORAGE_KEY } from '$lib/utils/constants';

interface AuthState {
	user: User | null;
	isAuthenticated: boolean;
	isLoading: boolean;
}

function createAuthStore() {
	const { subscribe, set, update } = writable<AuthState>({
		user: null,
		isAuthenticated: false,
		isLoading: true
	});

	return {
		subscribe,

		/**
		 * Инициализация: проверка токена и загрузка пользователя
		 */
		async init() {
			if (!browser) {
				update((state) => ({ ...state, isLoading: false }));
				return;
			}

			const token = localStorage.getItem(TOKEN_STORAGE_KEY);
			if (!token) {
				update((state) => ({ ...state, isLoading: false }));
				return;
			}

			try {
				const user = await authApi.getMe();
				set({
					user,
					isAuthenticated: true,
					isLoading: false
				});
			} catch (error) {
				// Токен невалиден, очищаем состояние
				localStorage.removeItem(TOKEN_STORAGE_KEY);
				localStorage.removeItem('refresh_token');
				set({
					user: null,
					isAuthenticated: false,
					isLoading: false
				});
			}
		},

		/**
		 * Установка пользователя после успешной авторизации
		 */
		async setUser(user: User) {
			set({
				user,
				isAuthenticated: true,
				isLoading: false
			});

			// Сливаем гостевую корзину с корзиной пользователя
			if (browser) {
				try {
					const { cartStore } = await import('./cart');
					await cartStore.mergeGuestCart();
					// Перезагружаем корзину после слияния
					await cartStore.init();
				} catch (error) {
					console.error('Failed to merge guest cart:', error);
				}
			}
		},

		/**
		 * Выход из системы
		 */
		async logout() {
			try {
				await authApi.logout();
			} catch (error) {
				console.error('Logout error:', error);
			} finally {
				set({
					user: null,
					isAuthenticated: false,
					isLoading: false
				});
			}
		},

		/**
		 * Очистка состояния (без запроса на сервер)
		 */
		clear() {
			set({
				user: null,
				isAuthenticated: false,
				isLoading: false
			});
		}
	};
}

export const authStore = createAuthStore();

/**
 * Проверка роли пользователя
 */
export const hasRole = derived(authStore, ($auth) => {
	return (role: Role | Role[]): boolean => {
		if (!$auth.isAuthenticated || !$auth.user) return false;
		const roles = Array.isArray(role) ? role : [role];
		return roles.includes($auth.user.role);
	};
});

/**
 * Проверка, является ли пользователь админом или менеджером
 */
export const isAdminOrManager = derived(authStore, ($auth) => {
	return $auth.isAuthenticated && $auth.user && 
		($auth.user.role === 'admin' || $auth.user.role === 'manager');
});
