// Запросы сервера SvelteKit к бэкенду от имени посетителя: с его входом из cookie и его IP

import type { Cookies, RequestEvent } from '@sveltejs/kit';
import type { User } from '$lib/types/auth';
import type { Cart } from '$lib/types/cart';
import { clientHeaders, upstreamUrl } from './upstream';
import { COOKIE_OPTIONS, renewSession } from './session';

export interface BackendInit extends RequestInit {
	/** Без входа: публичные данные должны быть одинаковы для всех */
	anonymous?: boolean;
	timeoutMs?: number;
}

const DEFAULT_TIMEOUT_MS = 10_000;

/**
 * Запрос к API бэкенда. path — без ведущего слэша и с query: `orders?page=2`.
 * Тело должно быть повторяемым (строка, ArrayBuffer): после 401 запрос повторяется с новым токеном
 */
export async function callBackend(event: RequestEvent, path: string, init: BackendInit = {}): Promise<Response> {
	const { anonymous = false, timeoutMs = DEFAULT_TIMEOUT_MS, headers, ...rest } = init;

	const send = (token: string | null) => {
		const outgoing = new Headers(headers);
		for (const [name, value] of Object.entries(clientHeaders(event))) outgoing.set(name, value);
		if (token) outgoing.set('authorization', `Bearer ${token}`);
		return fetch(upstreamUrl(path), { ...rest, headers: outgoing, signal: AbortSignal.timeout(timeoutMs) });
	};

	const token = anonymous ? null : event.locals.accessToken;
	const response = await send(token);
	if (response.status !== 401 || !token) return response;

	const renewed = await renewSession(event, token);
	if (!renewed) return response;
	await response.body?.cancel();
	return send(renewed);
}

/** Пользователь по входу из cookie. Один запрос /auth/me на запрос к витрине, сколько бы load его ни ждали */
export function currentUser(event: RequestEvent): Promise<User | null> {
	event.locals.user ??= fetchCurrentUser(event);
	return event.locals.user;
}

async function fetchCurrentUser(event: RequestEvent): Promise<User | null> {
	if (!event.locals.accessToken) return null;
	try {
		const response = await callBackend(event, 'auth/me', { timeoutMs: 5_000 });
		return response.ok ? await response.json() : null;
	} catch (error) {
		// Бэкенд недоступен: страница откроется как для гостя, вход восстановится при следующей загрузке
		console.error('[auth] /auth/me failed:', error);
		return null;
	}
}

// Гостевая корзина живёт на бэкенде по X-Session-Id. Номер — в httpOnly-cookie, как и вход
export const GUEST_COOKIE = 'shop_guest';
const GUEST_MAX_AGE = 90 * 24 * 60 * 60;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isUuid(value: unknown): value is string {
	return typeof value === 'string' && UUID.test(value);
}

/** Номер гостевой корзины; create заводит новый, если его ещё нет */
export function guestSessionId(cookies: Cookies, create = false): string | null {
	const current = cookies.get(GUEST_COOKIE);
	if (isUuid(current)) return current;
	return create ? setGuestSession(cookies, crypto.randomUUID()) : null;
}

export function setGuestSession(cookies: Cookies, sessionId: string): string {
	cookies.set(GUEST_COOKIE, sessionId, { ...COOKIE_OPTIONS, maxAge: GUEST_MAX_AGE });
	return sessionId;
}

export function clearGuestSession(cookies: Cookies): void {
	cookies.delete(GUEST_COOKIE, COOKIE_OPTIONS);
}

/**
 * Гость ещё ничего не клал в корзину. Бэкенд не спрашиваем: он заводит корзину на каждый
 * новый X-Session-Id, и каждый визит без покупок оставлял бы в базе пустую корзину
 */
export function emptyCart(): Cart {
	const now = new Date().toISOString();
	return { id: 0, userId: null, sessionId: null, createAt: now, updateAt: now, items: [] };
}
