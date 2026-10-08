// Server-side layout: настройки магазина, вошедший пользователь и корзина посетителя

import { API_BASE_URL } from '$lib/utils/constants';
import { callBackend, currentUser, emptyCart, guestSessionId } from '$lib/server/backend';
import type { Store } from '$lib/types/common';
import type { Cart } from '$lib/types/cart';
import type { RequestEvent } from '@sveltejs/kit';

// Настройки нужны каждой странице, а меняются редко: держим их минуту в памяти сервера,
// чтобы не ходить в API на каждый рендер. Правка в админке видна всем не позже чем через минуту
const CACHE_MS = 60_000;
const TIMEOUT_MS = 5_000;

let cached: { store: Store | null; expires: number } | null = null;

async function fetchStore(): Promise<Store | null> {
	const response = await fetch(`${API_BASE_URL}/store`, {
		headers: { 'Content-Type': 'application/json' },
		signal: AbortSignal.timeout(TIMEOUT_MS)
	});
	// 404 — магазин ещё не создан: это ответ, а не сбой, его тоже кэшируем
	if (response.status === 404) return null;
	if (!response.ok) throw new Error(`GET /store: ${response.status}`);
	return response.json();
}

async function loadStore(isDataRequest: boolean): Promise<Store | null> {
	// Кэш — только для первой отрисовки страницы. Запрос данных из браузера (переход, invalidateAll
	// после сохранения в админке) всегда берёт свежие настройки и заодно обновляет кэш
	if (!isDataRequest && cached && cached.expires > Date.now()) {
		return cached.store;
	}

	try {
		const store = await fetchStore();
		cached = { store, expires: Date.now() + CACHE_MS };
		return store;
	} catch (error) {
		console.error('Failed to load store settings:', error);
		// Бэкенд недоступен: лучше прежние настройки, чем страница без названия магазина
		return cached?.store ?? null;
	}
}

/** Корзина вошедшего — по токену, гостя — по cookie гостевой корзины. null — не загрузилась */
async function loadCart(event: RequestEvent): Promise<Cart | null> {
	const guest = event.locals.accessToken ? null : guestSessionId(event.cookies);
	if (!event.locals.accessToken && !guest) return emptyCart();

	try {
		const response = await callBackend(event, 'cart', {
			headers: guest ? { 'x-session-id': guest } : {},
			timeoutMs: TIMEOUT_MS
		});
		if (response.ok) return await response.json();
		// Сессия закончилась прямо сейчас: посетитель уже гость
		if (response.status === 401) return emptyCart();
		return null;
	} catch (error) {
		console.error('Failed to load cart:', error);
		return null;
	}
}

// Вход и корзина известны уже при отрисовке на сервере: шапка сразу с именем и счётчиком корзины,
// закрытые разделы проверяют доступ до отрисовки. Загрузка повторяется после входа и выхода (invalidateAll)
export async function load(event) {
	const [store, user, cart] = await Promise.all([
		loadStore(event.isDataRequest),
		currentUser(event),
		loadCart(event)
	]);
	return { store, user, cart };
}
