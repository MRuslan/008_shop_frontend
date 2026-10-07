// Единая обработка ошибок: человекочитаемые сообщения для UI и честные HTTP-статусы для server load

import { error } from '@sveltejs/kit';
import type { ApiError } from '$lib/types/api';
import { formatPrice } from './format';

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

/**
 * fetch бросает TypeError и в браузере («Failed to fetch»), и в Node («fetch failed»).
 * Оборванный по таймауту запрос — TimeoutError, отменённый — AbortError
 */
export function isNetworkError(err: unknown): boolean {
	return (
		err instanceof TypeError ||
		(err instanceof Error && (err.name === 'AbortError' || err.name === 'TimeoutError'))
	);
}

const SESSION_EXPIRED_MESSAGE = 'Сессия истекла. Войдите снова.';

/**
 * Бэкенд отвечает по-русски, но часть текстов покупателю лучше показать иначе:
 * «купон» на витрине называется «промокод», технические формулировки про токены — «сессия истекла».
 */
const KNOWN_MESSAGES: Record<string, string> = {
	'Пользователь с таким email уже зарегистрирован': 'Аккаунт с таким email уже есть. Войдите в него.',
	'Недействительный refresh-токен': SESSION_EXPIRED_MESSAGE,
	'Токен недействителен или истёк': SESSION_EXPIRED_MESSAGE,
	'Нужен access-токен': SESSION_EXPIRED_MESSAGE,
	'Требуется авторизация': 'Войдите, чтобы продолжить.',
	'Аккаунт заблокирован': 'Аккаунт заблокирован. Если это ошибка, свяжитесь с магазином.',
	// Стандартные тексты Nest без своего сообщения
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
	currentPassword: 'Текущий пароль',
	newPassword: 'Новый пароль',
	newEmail: 'Новый email',
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
	couponCode: 'Промокод',
	// Админка
	name: 'Название',
	slug: 'Адрес в ссылке (slug)',
	description: 'Описание',
	price: 'Цена',
	compareAtPrice: 'Старая цена',
	sku: 'Артикул',
	quantity: 'Количество',
	value: 'Значение',
	code: 'Код',
	contactEmail: 'Email магазина',
	contactPhone: 'Телефон магазина',
	logoUrl: 'Ссылка на логотип',
	faviconUrl: 'Ссылка на favicon',
	legalName: 'Юридическое название',
	inn: 'ИНН',
	legalAddress: 'Юридический адрес',
	currency: 'Валюта',
	timezone: 'Часовой пояс',
	locale: 'Локаль',
	'settings.delivery.price': 'Стоимость доставки',
	freeFrom: 'Бесплатно от',
	minOrderAmount: 'Заказ с доставкой от',
	maxUses: 'Всего применений',
	maxUsesPerUser: 'Применений на покупателя',
	minSubtotal: 'Минимальная сумма',
	openingHours: 'График работы'
};

const hasCyrillic = (text: string) => /[А-Яа-яЁё]/.test(text);

/** Имя поля для человека: `email` → «Email»; у вложенного пути берём последний сегмент */
function fieldLabel(field: string): string {
	return FIELD_NAMES[field] ?? FIELD_NAMES[field.split('.').pop() ?? ''] ?? field;
}

/**
 * Одно сообщение бэкенда в текст для покупателя; null — показать запасной текст.
 * Годится и для текстов вне ошибок, например для причины отказа промокода в предрасчёте
 */
export function humanizeMessage(message: string): string | null {
	const trimmed = message.trim();
	if (!trimmed) return null;
	const known = KNOWN_MESSAGES[trimmed];
	if (known) return known;

	const minSubtotal = trimmed.match(/^Купон действует для заказов от ([\d.]+)$/);
	if (minSubtotal) return `Промокод действует для заказов от\u00a0${formatPrice(minSubtotal[1])}.`;

	// Валидация приходит строками «поле: текст»: имя поля переводим, текст оставляем
	const validation = trimmed.match(/^([\w.]+): (.+)$/);
	if (validation && hasCyrillic(validation[2])) return `${fieldLabel(validation[1])}: ${validation[2]}`;

	// Непереведённый технический текст («Bad Request», стектрейс) покупателю не показываем
	return hasCyrillic(trimmed) ? trimmed : null;
}

// Проверки типа: если поле нарушило такую проверку вместе с другими, значение просто не передали
const TYPE_CONSTRAINTS = new Set(['isDefined', 'isNotEmpty', 'isString', 'isNumber', 'isInt', 'isBoolean']);

/**
 * Одна понятная ошибка на поле: { field, text } без заглавной буквы и точки.
 * Для пустого поля class-validator шлёт сразу «должно быть строкой», «не короче» и «не длиннее»,
 * человеку из этого нужно одно: «заполните поле»
 */
function fieldProblems(err: ApiError): Array<{ field: string; text: string }> {
	const byField = new Map<string, Array<{ constraint: string; message: string }>>();
	for (const item of err.errors ?? []) {
		if (!item?.field || !item.message) continue;
		const list = byField.get(item.field) ?? [];
		list.push(item);
		byField.set(item.field, list);
	}
	return [...byField].map(([field, items]) => {
		const missing = items.length > 1 && items.some((item) => TYPE_CONSTRAINTS.has(item.constraint));
		return { field, text: missing ? 'заполните это поле' : items[0].message };
	});
}

/**
 * Ошибки валидации по полям из `errors` ответа 400: { email: 'Должно быть корректным email' }.
 * По одному сообщению на поле; формы показывают их рядом с полями
 */
export function getFieldErrors(err: unknown): Record<string, string> {
	if (!isApiError(err) || !Array.isArray(err.errors)) return {};
	return Object.fromEntries(
		fieldProblems(err).map(({ field, text }) => [field, text.charAt(0).toUpperCase() + text.slice(1)])
	);
}

/**
 * Возвращает сообщение, которое можно показать пользователю.
 * Понимает ApiError бэкенда (message строкой или массивом), сетевые ошибки, Error и строки.
 * Нерусские технические тексты заменяются на fallback.
 */
export function getErrorMessage(
	err: unknown,
	fallback = 'Что-то пошло не так. Попробуйте ещё раз.'
): string {
	if (isNetworkError(err)) return NETWORK_ERROR_MESSAGE;

	if (isApiError(err)) {
		// Ошибки по полям: одна на поле, с человеческим названием поля
		if (Array.isArray(err.errors) && err.errors.length > 0) {
			return fieldProblems(err)
				.map(({ field, text }) => `${fieldLabel(field)}: ${text}.`)
				.join(' ');
		}

		const raw = Array.isArray(err.message) ? err.message : [err.message];
		const messages = [
			...new Set(raw.filter((m): m is string => typeof m === 'string').map(humanizeMessage).filter(Boolean))
		];
		return messages.length ? messages.join(' ') : fallback;
	}

	if (err instanceof Error) return humanizeMessage(err.message) ?? fallback;
	if (typeof err === 'string') return humanizeMessage(err) ?? fallback;
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
		// Бэкенд упал или прокси не достучался (502, 504): это временно, поисковику — «зайди позже»
		if (err.statusCode >= 500) {
			error(503, 'Сервис временно недоступен. Попробуйте обновить страницу через минуту.');
		}
	}

	if (isNetworkError(err)) {
		error(503, 'Сервис временно недоступен. Попробуйте обновить страницу через минуту.');
	}

	error(500, 'Не удалось загрузить данные. Попробуйте позже.');
}
