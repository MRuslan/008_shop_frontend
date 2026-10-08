// Store для управления состоянием авторизации

import { writable, derived } from 'svelte/store';
import { browser } from '$app/environment';
import { authApi } from '$lib/api/auth';
import type { User, Role } from '$lib/types/auth';
import { TOKEN_STORAGE_KEY } from '$lib/utils/constants';
import { AUTH_EXPIRED_EVENT } from '$lib/api/client';

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

	// Корзина пользователя остаётся на сервере; после выхода показываем гостевую
	async function reloadCartAsGuest() {
		const { cartStore } = await import('./cart');
		await cartStore.init();
	}

	// Refresh-токен отозван или истёк: интерфейс не должен считать пользователя вошедшим
	if (browser) {
		window.addEventListener(AUTH_EXPIRED_EVENT, () => {
			set({ user: null, isAuthenticated: false, isLoading: false });
			void reloadCartAsGuest();
		});
	}

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
				// Токены стираем, только если бэкенд их отверг (клиент уже пробовал refresh).
				// Сбой сети не повод разлогинивать: при следующей загрузке вход восстановится
				if ((error as { statusCode?: number })?.statusCode === 401) {
					localStorage.removeItem(TOKEN_STORAGE_KEY);
					localStorage.removeItem('refresh_token');
				}
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
		 * Обновить данные вошедшего пользователя (например, имя после правки профиля)
		 */
		patchUser(changes: Partial<User>) {
			update((state) => (state.user ? { ...state, user: { ...state.user, ...changes } } : state));
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
				if (browser) await reloadCartAsGuest();
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
