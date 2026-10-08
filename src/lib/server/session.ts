// Вход посетителя хранит сервер SvelteKit: пара токенов бэкенда лежит в httpOnly-cookie,
// и скрипты страницы (а значит, и внедрённый чужой скрипт) не могут её прочитать.
// Здесь cookie, обмен refresh-токена и восстановление входа для каждого запроса

import type { Cookies, RequestEvent } from '@sveltejs/kit';
import { dev } from '$app/environment';
import { clientHeaders, upstreamUrl } from './upstream';

export const ACCESS_COOKIE = 'shop_access';
export const REFRESH_COOKIE = 'shop_refresh';

export interface TokenPair {
	access_token: string;
	refresh_token: string;
}

type Exchange = { status: 'ok'; pair: TokenPair } | { status: 'rejected' } | { status: 'unavailable' };

// Lax: cookie уходят при переходе по ссылке из письма, но не с запросами чужих сайтов.
// Secure вне разработки: по http (адрес в локальной сети при vite dev) браузер отбросил бы такую cookie
export const COOKIE_OPTIONS = { path: '/', httpOnly: true, sameSite: 'lax', secure: !dev } as const;

/** Если access-токену осталось жить меньше, пару обновляем заранее, а не ловим 401 */
const RENEW_BEFORE_MS = 30_000;
const REFRESH_TIMEOUT_MS = 10_000;

/** Срок жизни JWT из поля exp, мс. Подпись не проверяем: это дело бэкенда */
function expiresAt(token: string): number | null {
	try {
		const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64url').toString('utf8'));
		return typeof payload.exp === 'number' ? payload.exp * 1000 : null;
	} catch {
		return null;
	}
}

/** Cookie живёт столько же, сколько токен: истёкший браузер сам перестанет присылать */
function maxAgeSeconds(token: string, fallback: number): number {
	const expiry = expiresAt(token);
	return expiry ? Math.max(1, Math.floor((expiry - Date.now()) / 1000)) : fallback;
}

export function setSessionCookies(cookies: Cookies, pair: TokenPair): void {
	cookies.set(ACCESS_COOKIE, pair.access_token, {
		...COOKIE_OPTIONS,
		maxAge: maxAgeSeconds(pair.access_token, 15 * 60)
	});
	cookies.set(REFRESH_COOKIE, pair.refresh_token, {
		...COOKIE_OPTIONS,
		maxAge: maxAgeSeconds(pair.refresh_token, 7 * 24 * 60 * 60)
	});
}

export function clearSessionCookies(cookies: Cookies): void {
	cookies.delete(ACCESS_COOKIE, COOKIE_OPTIONS);
	cookies.delete(REFRESH_COOKIE, COOKIE_OPTIONS);
}

// Бэкенд считает повторный обмен одного refresh-токена кражей и отзывает сессию. А параллельные
// запросы одного посетителя (страница и её данные, несколько вкладок) приходят с одной и той же cookie.
// Поэтому обмен идёт один на токен, а его результат ещё минуту отдаётся опоздавшим: браузер мог
// отправить запрос со старой cookie раньше, чем получил новую.
// Карты живут в памяти процесса: несколько экземпляров витрины нужно ставить с привязкой посетителя
// к экземпляру (sticky sessions), иначе опоздавший запрос на соседний экземпляр отзовёт сессию
const pending = new Map<string, Promise<Exchange>>();
const settled = new Map<string, { result: Exchange; until: number }>();
const SETTLED_MS = 60_000;

function remember(refreshToken: string, result: Exchange): void {
	const now = Date.now();
	for (const [token, entry] of settled) {
		if (entry.until <= now) settled.delete(token);
	}
	settled.set(refreshToken, { result, until: now + SETTLED_MS });
}

async function requestNewPair(event: RequestEvent, refreshToken: string): Promise<Exchange> {
	try {
		const response = await fetch(upstreamUrl('auth/refresh'), {
			method: 'POST',
			headers: { ...clientHeaders(event), 'content-type': 'application/json' },
			body: JSON.stringify({ refresh_token: refreshToken }),
			signal: AbortSignal.timeout(REFRESH_TIMEOUT_MS)
		});
		if (response.ok) return { status: 'ok', pair: await response.json() };
		// 400, 401, 403: токен отозван, истёк или аккаунт заблокирован. 429 и 5xx — временно
		if (response.status < 500 && response.status !== 429) return { status: 'rejected' };
		return { status: 'unavailable' };
	} catch (error) {
		console.error('[auth] refresh failed:', error);
		return { status: 'unavailable' };
	}
}

export function exchangeRefreshToken(event: RequestEvent, refreshToken: string): Promise<Exchange> {
	const recent = settled.get(refreshToken);
	if (recent && recent.until > Date.now()) return Promise.resolve(recent.result);

	let exchange = pending.get(refreshToken);
	if (!exchange) {
		exchange = requestNewPair(event, refreshToken)
			.then((result) => {
				// Сбой сети не запоминаем: следующий запрос попробует снова
				if (result.status !== 'unavailable') remember(refreshToken, result);
				return result;
			})
			.finally(() => pending.delete(refreshToken));
		pending.set(refreshToken, exchange);
	}
	return exchange;
}

/** Вход закончился: cookie стираем, браузер узнает об этом из заголовка ответа (см. hooks.server.ts) */
export function endSession(event: RequestEvent): void {
	clearSessionCookies(event.cookies);
	event.locals.accessToken = null;
	event.locals.sessionEnded = true;
}

async function renew(event: RequestEvent, refreshToken: string): Promise<string | null> {
	const result = await exchangeRefreshToken(event, refreshToken);
	if (result.status === 'ok') {
		setSessionCookies(event.cookies, result.pair);
		event.locals.accessToken = result.pair.access_token;
		return result.pair.access_token;
	}
	if (result.status === 'rejected') endSession(event);
	// Бэкенд недоступен: cookie не трогаем, сессия ещё может быть жива
	return null;
}

/**
 * Вход для текущего запроса: действующий access-токен из cookie или свежая пара по refresh-токену.
 * Вызывается из hooks до загрузки страницы и до прокси /api
 */
export async function restoreSession(event: RequestEvent): Promise<void> {
	const access = event.cookies.get(ACCESS_COOKIE) || null;
	const refresh = event.cookies.get(REFRESH_COOKIE) || null;
	event.locals.accessToken = access;
	event.locals.sessionEnded = false;

	// Токен без exp оставляем: если он негоден, бэкенд ответит 401 и сработает renewSession
	const expiry = access ? expiresAt(access) : null;
	const fresh = access !== null && (expiry === null || expiry - Date.now() > RENEW_BEFORE_MS);
	if (fresh || !refresh) return;

	await renew(event, refresh);
}

/**
 * Бэкенд отверг access-токен: сессию отозвали с другого устройства или токен уже заменён обменом
 * в соседнем запросе. Возвращает новый токен для повтора запроса или null
 */
export async function renewSession(event: RequestEvent, rejectedToken: string): Promise<string | null> {
	const refresh = event.cookies.get(REFRESH_COOKIE);
	if (!refresh) {
		endSession(event);
		return null;
	}
	const token = await renew(event, refresh);
	// Из памяти пришла та же пара, что бэкенд только что отверг: сессию отозвали уже после обмена
	if (token === rejectedToken) {
		endSession(event);
		return null;
	}
	return token;
}
