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

const SESSION_EXPIRED_MESSAGE = 'Сессия истекла. Войдите снова.';

/**
 * Сообщения бэкенда, которые покупатель не должен видеть как есть: английские тексты авторизации
 * и формулировки про «купон», когда в интерфейсе покупателя это «промокод».
 */
const KNOWN_MESSAGES: Record<string, string> = {
	'Invalid credentials': 'Неверный email или пароль.',
	'User with this email already exists': 'Аккаунт с таким email уже есть. Войдите в него.',
	'User not found': 'Аккаунт не найден. Войдите заново.',
	'Invalid password': 'Неверный пароль.',
	'Invalid refresh token': SESSION_EXPIRED_MESSAGE,
	'Token is invalid or expired': SESSION_EXPIRED_MESSAGE,
	'Not an access token': SESSION_EXPIRED_MESSAGE,
	Unauthorized: 'Войдите, чтобы продолжить.',
	'Forbidden resource': 'Недостаточно прав для этого действия.',
	'Купон не найден или недействителен': 'Промокод не найден или больше не действует. Уберите его или введите другой.',
	'Срок действия купона истёк': 'Срок действия промокода истёк. Уберите его, чтобы оформить заказ.',
	'Купон ещё не действует': 'Промокод ещё не начал действовать. Уберите его, чтобы оформить заказ.',
	'Лимит применений купона исчерпан': 'Промокод больше не действует: его уже использовали максимальное число раз.',
	'Вы уже использовали этот купон': 'Вы уже использовали этот промокод.',
	'Точка самовывоза не найдена или недоступна': 'Эта точка самовывоза сейчас недоступна. Выберите другую.'
};

/** Названия полей из DTO бэкенда для сообщений валидации */
const FIELD_NAMES: Record<string, string> = {
	email: 'Email',
	password: 'Пароль',
	username: 'Имя',
	label: 'Название адреса',
	city: 'Город',
	street: 'Улица',
	building: 'Дом',
	apartment: 'Квартира или офис',
	postalCode: 'Индекс',
	phone: 'Телефон',
	text: 'Текст отзыва',
	comment: 'Комментарий',
	couponCode: 'Промокод'
};

function symbols(count: number): string {
	const n = count % 100;
	const n1 = n % 10;
	if (n > 10 && n < 20) return 'символов';
	if (n1 === 1) return 'символ';
	if (n1 > 1 && n1 < 5) return 'символа';
	return 'символов';
}

/** Стандартные английские сообщения class-validator → понятная русская подсказка */
function translateValidation(message: string): string | null {
	let match = message.match(/^(\w+) must be an email$/);
	if (match) return 'Проверьте email: в адресе есть ошибка.';

	match = message.match(/^(\w+) must be longer than or equal to (\d+) characters$/);
	if (match) {
		const n = Number(match[2]);
		return `${FIELD_NAMES[match[1]] ?? 'Поле'}: не короче ${n} ${symbols(n)}.`;
	}

	match = message.match(/^(\w+) must be shorter than or equal to (\d+) characters$/);
	if (match) {
		const n = Number(match[2]);
		return `${FIELD_NAMES[match[1]] ?? 'Поле'}: не длиннее ${n} ${symbols(n)}.`;
	}

	match = message.match(/^(\w+) (should not be empty|must be a string)$/);
	if (match) return `Заполните поле «${FIELD_NAMES[match[1]] ?? match[1]}».`;

	return null;
}

const hasCyrillic = (text: string) => /[А-Яа-яЁё]/.test(text);

/** Одно сообщение бэкенда в текст для покупателя; null — показать запасной текст */
function humanize(message: string): string | null {
	const trimmed = message.trim();
	if (!trimmed) return null;
	const known = KNOWN_MESSAGES[trimmed] ?? translateValidation(trimmed);
	if (known) return known;
	// Непереведённый технический текст («Bad Request», стектрейс) покупателю не показываем
	return hasCyrillic(trimmed) ? trimmed : null;
}

/**
 * Возвращает сообщение, которое можно показать пользователю.
 * Понимает ApiError бэкенда (message строкой или массивом), сетевые ошибки, Error и строки.
 * Английские сообщения бэкенда переводятся; всё, что перевести не удалось, заменяется на fallback.
 */
export function getErrorMessage(
	err: unknown,
	fallback = 'Что-то пошло не так. Попробуйте ещё раз.'
): string {
	if (isNetworkError(err)) return NETWORK_ERROR_MESSAGE;

	if (isApiError(err)) {
		const raw = Array.isArray(err.message) ? err.message : [err.message];
		const messages = [
			...new Set(raw.filter((m): m is string => typeof m === 'string').map(humanize).filter(Boolean))
		];
		return messages.length ? messages.join(' ') : fallback;
	}

	if (err instanceof Error) return humanize(err.message) ?? fallback;
	if (typeof err === 'string') return humanize(err) ?? fallback;
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
