// Утилиты для работы с сессией

import { SESSION_ID_KEY } from './constants';

/**
 * Генерирует или получает существующий sessionId для гостевой корзины
 */
export function getOrCreateSessionId(): string {
	if (typeof window === 'undefined') {
		// SSR - возвращаем пустую строку
		return '';
	}

	let sessionId = sessionStorage.getItem(SESSION_ID_KEY);
	
	if (!sessionId) {
		// Генерируем UUID v4
		sessionId = crypto.randomUUID();
		sessionStorage.setItem(SESSION_ID_KEY, sessionId);
	}
	
	return sessionId;
}

/**
 * Очищает sessionId
 */
export function clearSessionId(): void {
	if (typeof window !== 'undefined') {
		sessionStorage.removeItem(SESSION_ID_KEY);
	}
}
