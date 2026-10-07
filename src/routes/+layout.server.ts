// Server-side layout: загрузка настроек магазина

import { API_BASE_URL } from '$lib/utils/constants';
import type { Store } from '$lib/types/common';

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

export async function load({ isDataRequest }) {
	// Кэш — только для первой отрисовки страницы. Запрос данных из браузера (переход, invalidateAll
	// после сохранения в админке) всегда берёт свежие настройки и заодно обновляет кэш
	if (!isDataRequest && cached && cached.expires > Date.now()) {
		return { store: cached.store };
	}

	try {
		const store = await fetchStore();
		cached = { store, expires: Date.now() + CACHE_MS };
		return { store };
	} catch (error) {
		console.error('Failed to load store settings:', error);
		// Бэкенд недоступен: лучше прежние настройки, чем страница без названия магазина
		return { store: cached?.store ?? null };
	}
}
