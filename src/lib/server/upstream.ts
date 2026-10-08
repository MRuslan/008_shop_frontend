// Адрес бэкенда и сведения о посетителе для запросов сервера SvelteKit к API

import type { RequestEvent } from '@sveltejs/kit';
import { API_BASE_URL } from '$lib/utils/constants';

/** path — путь API без ведущего слэша и с query: `products?page=2` */
export function upstreamUrl(path: string): string {
	return `${API_BASE_URL}/${path.replace(/^\/+/, '')}`;
}

/**
 * Бэкенд считает лимиты запросов (10 входов в минуту с одного IP) и пишет IP и устройство в сессию.
 * Без этих заголовков все посетители выглядели бы для него одним адресом — сервером витрины.
 * X-Forwarded-For он учитывает, только если в его TRUST_PROXY указан адрес этого сервера
 */
export function clientHeaders(event: RequestEvent): Record<string, string> {
	const headers: Record<string, string> = {};
	try {
		headers['x-forwarded-for'] = event.getClientAddress();
	} catch {
		// Адаптер не знает адрес посетителя: бэкенд увидит адрес сервера витрины
	}
	const userAgent = event.request.headers.get('user-agent');
	if (userAgent) headers['user-agent'] = userAgent;
	const language = event.request.headers.get('accept-language');
	if (language) headers['accept-language'] = language;
	return headers;
}
