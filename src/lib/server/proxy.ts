// Прокси /api/* → бэкенд. Браузер ходит только на свой сайт: вход сервер подставляет из httpOnly-cookie,
// гостевую корзину — из cookie гостя. Вход, регистрация и выход перехватываются: токены из ответа
// бэкенда остаются в cookie и в браузер не попадают

import { json, type RequestEvent } from '@sveltejs/kit';
import { ANONYMOUS_HEADER } from '$lib/utils/constants';
import { isSiteUrlConfigured, siteOrigin } from '$lib/utils/site';
import type { User } from '$lib/types/auth';
import {
	callBackend,
	clearGuestSession,
	emptyCart,
	guestSessionId,
	isUuid,
	setGuestSession
} from './backend';
import { clearSessionCookies, exchangeRefreshToken, setSessionCookies, type TokenPair } from './session';

type Handler = (event: RequestEvent) => Promise<Response>;

const PREFIX = '/api/';
const REQUEST_HEADERS = ['content-type', 'accept', 'if-none-match'];
const RESPONSE_HEADERS = ['content-type', 'content-disposition', 'etag', 'last-modified', 'retry-after'];
const NULL_BODY_STATUSES = new Set([101, 204, 205, 304]);
/** Бэкенд сжимает фото в WebP и делает превью: на большом снимке это дольше обычного запроса */
const UPLOAD_TIMEOUT_MS = 60_000;

function pick(source: Headers, names: string[]): Headers {
	const headers = new Headers();
	for (const name of names) {
		const value = source.get(name);
		if (value) headers.set(name, value);
	}
	return headers;
}

// Ответы зависят от cookie посетителя: общим кэшам (CDN, прокси) их хранить нельзя
const PRIVATE = { 'cache-control': 'private, no-store' };

function problem(status: number, message: string): Response {
	return json({ statusCode: status, message }, { status, headers: PRIVATE });
}

/** Ответ бэкенда как есть, но без его служебных заголовков: fetch уже распаковал тело */
function relay(response: Response): Response {
	const headers = pick(response.headers, RESPONSE_HEADERS);
	headers.set('cache-control', PRIVATE['cache-control']);
	const body = NULL_BODY_STATUSES.has(response.status) ? null : response.body;
	return new Response(body, { status: response.status, statusText: response.statusText, headers });
}

/**
 * Cookie с SameSite=Lax и так не уходят с запросами чужих сайтов; Origin — второй рубеж.
 * Встроенная проверка SvelteKit смотрит только формы, а сюда приходит JSON
 */
function isSameOrigin(event: RequestEvent): boolean {
	const origin = event.request.headers.get('origin');
	if (!origin) return event.request.headers.get('sec-fetch-site') !== 'cross-site';
	return origin === event.url.origin || (isSiteUrlConfigured() && origin === siteOrigin(event.url));
}

async function readBody(event: RequestEvent): Promise<ArrayBuffer | undefined> {
	const { method } = event.request;
	if (method === 'GET' || method === 'HEAD') return undefined;
	const body = await event.request.arrayBuffer();
	return body.byteLength > 0 ? body : undefined;
}

async function forward(event: RequestEvent, path: string): Promise<Response> {
	const { request, cookies, locals } = event;
	const anonymous = request.headers.get(ANONYMOUS_HEADER) === '1';
	const headers = pick(request.headers, REQUEST_HEADERS);

	// Корзину гостя бэкенд узнаёт по X-Session-Id. Номер заводим при первом изменении корзины:
	// просмотр пустой корзины не должен оставлять на бэкенде корзину на каждого посетителя
	if (!anonymous && !locals.accessToken && (path === 'cart' || path.startsWith('cart/'))) {
		const viewOnly = request.method === 'GET' && path === 'cart';
		const guest = guestSessionId(cookies, !viewOnly);
		if (!guest) return json(emptyCart(), { headers: PRIVATE });
		headers.set('x-session-id', guest);
	}

	const multipart = headers.get('content-type')?.startsWith('multipart/') ?? false;
	const response = await callBackend(event, `${path}${event.url.search}`, {
		method: request.method,
		headers,
		body: await readBody(event),
		anonymous,
		timeoutMs: multipart ? UPLOAD_TIMEOUT_MS : undefined
	});
	// Нужен вход, а его нет: например, выход в соседней вкладке стёр общие cookie.
	// Заголовок об окончании входа переведёт и эту вкладку в гостевой режим
	if (response.status === 401 && !anonymous && !locals.accessToken) {
		locals.sessionEnded = true;
	}
	return relay(response);
}

/** Корзина, собранная до входа, переезжает в корзину аккаунта; гостевая cookie после этого не нужна */
async function mergeGuestCart(event: RequestEvent): Promise<void> {
	const sessionId = guestSessionId(event.cookies);
	if (!sessionId) return;
	try {
		const response = await callBackend(event, 'cart/merge-session', {
			method: 'POST',
			headers: { 'content-type': 'application/json' },
			body: JSON.stringify({ sessionId })
		});
		await response.body?.cancel();
		// Не вышло — cookie оставляем: корзина гостя сольётся при следующем входе
		if (response.ok) clearGuestSession(event.cookies);
	} catch (error) {
		console.error('[auth] guest cart merge failed:', error);
	}
}

/** Вход и регистрация: пара токенов уходит в cookie, браузер получает только пользователя */
function signIn(path: string): Handler {
	return async (event) => {
		const response = await callBackend(event, path, {
			method: 'POST',
			headers: { 'content-type': 'application/json' },
			body: await readBody(event),
			anonymous: true
		});
		if (!response.ok) return relay(response);

		const { user, ...pair } = (await response.json()) as TokenPair & { user: User };

		// В этом браузере уже был вход (другой аккаунт или тот же): прежнюю сессию отзываем
		if (event.locals.accessToken) {
			await callBackend(event, 'auth/logout', { method: 'POST' })
				.then((previous) => previous.body?.cancel())
				.catch(() => {});
		}

		setSessionCookies(event.cookies, pair);
		event.locals.accessToken = pair.access_token;
		event.locals.sessionEnded = false;
		await mergeGuestCart(event);
		return json({ user }, { headers: PRIVATE });
	};
}

/** Выход: бэкенд отзывает сессию. Даже если он недоступен, в этом браузере вход заканчивается */
async function signOut(event: RequestEvent): Promise<Response> {
	if (event.locals.accessToken) {
		await callBackend(event, 'auth/logout', { method: 'POST' })
			.then((response) => response.body?.cancel())
			.catch(() => {});
	}
	clearSessionCookies(event.cookies);
	event.locals.accessToken = null;
	// Выход — не «сессия истекла»: браузер сам знает, что вышел
	event.locals.sessionEnded = false;
	return json({ message: 'Вы вышли из аккаунта' }, { headers: PRIVATE });
}

/**
 * Прежняя версия витрины хранила refresh-токен и номер гостевой корзины в localStorage.
 * Браузер один раз присылает их сюда, дальше они живут в httpOnly-cookie
 */
async function adoptLegacySession(event: RequestEvent): Promise<Response> {
	const body = await event.request.json().catch(() => ({}));
	const refreshToken = typeof body?.refreshToken === 'string' ? body.refreshToken : null;

	if (isUuid(body?.sessionId) && !guestSessionId(event.cookies)) {
		setGuestSession(event.cookies, body.sessionId);
	}

	if (!event.locals.accessToken && refreshToken) {
		const result = await exchangeRefreshToken(event, refreshToken);
		if (result.status === 'ok') {
			setSessionCookies(event.cookies, result.pair);
			event.locals.accessToken = result.pair.access_token;
		}
	}
	if (event.locals.accessToken) await mergeGuestCart(event);

	return json({ authenticated: !!event.locals.accessToken }, { headers: PRIVATE });
}

const INTERCEPTED: Record<string, Handler> = {
	'POST auth/login': signIn('auth/login'),
	'POST auth/register': signIn('auth/register'),
	// Пару обновляет сервер витрины; refresh-токена у браузера нет
	'POST auth/refresh': async () => problem(404, 'Not Found'),
	'POST auth/logout': signOut,
	'POST bff/legacy-session': adoptLegacySession
};

export async function proxy(event: RequestEvent): Promise<Response> {
	const { method } = event.request;
	// Путь берём из адреса как есть, с %-кодированием: params уже раскодированы
	const path = event.url.pathname.slice(PREFIX.length);

	if (method !== 'GET' && method !== 'HEAD' && !isSameOrigin(event)) {
		return problem(403, 'Запрос с другого сайта отклонён.');
	}

	try {
		const handler = INTERCEPTED[`${method} ${path}`];
		return handler ? await handler(event) : await forward(event, path);
	} catch (error) {
		// Тело больше BODY_SIZE_LIMIT сервера витрины (adapter-node, по умолчанию 512 КБ): чаще всего фото
		if ((error as { status?: number })?.status === 413) {
			return problem(413, 'Файл слишком большой для загрузки.');
		}
		console.error(`[api] ${method} /${path}:`, error);
		return problem(503, 'Сервер магазина не отвечает. Попробуйте ещё раз через минуту.');
	}
}
