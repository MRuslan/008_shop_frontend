// Утилиты для работы с сессией

import { SESSION_ID_KEY } from './constants';

/**
 * Генерирует или получает существующий sessionId для гостевой корзины.
 * Живёт в localStorage: в sessionStorage у каждой вкладки была бы своя корзина,
 * и товар, открытый в новой вкладке, попадал бы в другую
 */
export function getOrCreateSessionId(): string {
	if (typeof window === 'undefined') {
		// SSR - возвращаем пустую строку
		return '';
	}

	let sessionId = localStorage.getItem(SESSION_ID_KEY);

	if (!sessionId) {
		// Корзина, собранная до этого исправления, осталась в sessionStorage текущей вкладки
		sessionId = sessionStorage.getItem(SESSION_ID_KEY) ?? crypto.randomUUID();
		localStorage.setItem(SESSION_ID_KEY, sessionId);
		sessionStorage.removeItem(SESSION_ID_KEY);
	}
	
	return sessionId;
}

/**
 * Очищает sessionId
 */
export function clearSessionId(): void {
	if (typeof window !== 'undefined') {
		localStorage.removeItem(SESSION_ID_KEY);
	}
}
