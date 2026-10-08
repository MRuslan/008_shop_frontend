// Store для управления состоянием авторизации.
// Источник правды — сервер: пользователь приходит из корневого layout (вход в httpOnly-cookie),
// store только раздаёт его компонентам и меняется сразу при входе и правке профиля

import { writable, derived } from 'svelte/store';
import { browser } from '$app/environment';
import { invalidateAll } from '$app/navigation';
import { authApi } from '$lib/api/auth';
import type { User, Role } from '$lib/types/auth';
import { AUTH_EXPIRED_EVENT } from '$lib/api/client';

interface AuthState {
	user: User | null;
	isAuthenticated: boolean;
}

const SIGNED_OUT: AuthState = { user: null, isAuthenticated: false };

function createAuthStore() {
	const { subscribe, set, update } = writable<AuthState>(SIGNED_OUT);

	// Сервер витрины не смог продлить вход (сессию отозвали с другого устройства, неделя без визитов).
	// Перечитываем данные: шапка и корзина станут гостевыми, закрытый раздел отправит на вход
	if (browser) {
		window.addEventListener(AUTH_EXPIRED_EVENT, () => {
			void invalidateAll().finally(() => set(SIGNED_OUT));
		});
	}

	return {
		subscribe,

		/**
		 * Вход с сервера (корневой layout): при SSR, первом рендере и после повторной загрузки.
		 * signedIn без user — вход действует, а профиль бэкенд не отдал: его догрузит loadProfile
		 */
		hydrate(user: User | null, signedIn = user !== null) {
			set(signedIn ? { user, isAuthenticated: true } : SIGNED_OUT);
		},

		/**
		 * Догрузить профиль вошедшего, если сервер не получил его при отрисовке. При сбое store не меняется;
		 * если вход уже закончился, клиент API сам сообщит об этом (AUTH_EXPIRED_EVENT)
		 */
		async loadProfile(): Promise<boolean> {
			try {
				const user = await authApi.getMe();
				update((state) => (state.isAuthenticated ? { user, isAuthenticated: true } : state));
				return true;
			} catch {
				return false;
			}
		},

		/**
		 * Вход или регистрация прошли: cookie уже у браузера, гостевую корзину сервер слил с корзиной аккаунта.
		 * Перечитываем данные страниц: корзина, избранное и закрытые разделы зависят от входа
		 */
		async setUser(user: User) {
			set({ user, isAuthenticated: true });
			await invalidateAll();
		},

		/**
		 * Обновить данные вошедшего пользователя (например, имя после правки профиля)
		 */
		patchUser(changes: Partial<User>) {
			update((state) => (state.user ? { ...state, user: { ...state.user, ...changes } } : state));
		},

		/**
		 * Выход: сервер отзывает сессию и стирает cookie. Store обновит повторная загрузка данных:
		 * вызывающий переходит с invalidateAll, и закрытая страница не мигает «Нужен вход» до ухода с неё
		 */
		async logout() {
			try {
				await authApi.logout();
			} catch (error) {
				console.error('Logout error:', error);
			}
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
