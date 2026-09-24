// Единая обработка ошибок: человекочитаемые сообщения для UI и честные HTTP-статусы для server load

import { error } from '@sveltejs/kit';
import type { ApiError } from '$lib/types/api';

export const NETWORK_ERROR_MESSAGE =
	'Не удалось связаться с сервером. Проверьте соединение и попробуйте ещё раз.';

export function isApiError(err: unknown): err is ApiError {
	return (
		typeof err === 'object' &&
		err !== null &&
		'statusCode' in err &&
		typeof (err as ApiError).statusCode === 'number'
	);
}

/** fetch бросает TypeError и в браузере («Failed to fetch»), и в Node («fetch failed») */
export function isNetworkError(err: unknown): boolean {
	return err instanceof TypeError || (err instanceof Error && err.name === 'AbortError');
}

/**
 * Возвращает сообщение, которое можно показать пользователю.
 * Понимает ApiError бэкенда (message строкой или массивом), сетевые ошибки, Error и строки.
 */
export function getErrorMessage(
	err: unknown,
	fallback = 'Что-то пошло не так. Попробуйте ещё раз.'
): string {
	if (isNetworkError(err)) return NETWORK_ERROR_MESSAGE;

	if (isApiError(err)) {
		const message = err.message;
		if (Array.isArray(message)) {
			const joined = message.filter(Boolean).join('. ');
			return joined || fallback;
		}
		if (typeof message === 'string' && message.trim()) return message;
		return fallback;
	}

	if (err instanceof Error && err.message.trim()) return err.message;
	if (typeof err === 'string' && err.trim()) return err;
	return fallback;
}

interface HttpErrorOptions {
	/** Текст для 404 */
	notFound?: string;
	/** Показывать 403 как 404, чтобы не раскрывать существование чужих данных */
	forbiddenAsNotFound?: boolean;
}

/**
 * Для +page.server.ts: превращает ошибку API в HTTP-ошибку SvelteKit с честным статусом.
 * 404 остаётся 404, недоступный бэкенд становится 503, а не «500 Ошибка загрузки».
 */
export function throwHttpError(err: unknown, options: HttpErrorOptions = {}): never {
	if (isApiError(err)) {
		if (err.statusCode === 404 || (err.statusCode === 403 && options.forbiddenAsNotFound)) {
			error(404, options.notFound ?? 'Страница не найдена');
		}
		if (err.statusCode === 403) error(403, 'У вас нет доступа к этой странице');
		if (err.statusCode === 401) error(401, 'Войдите, чтобы открыть эту страницу');
	}

	if (isNetworkError(err)) {
		error(503, 'Сервис временно недоступен. Попробуйте обновить страницу через минуту.');
	}

	error(500, 'Не удалось загрузить данные. Попробуйте позже.');
}
