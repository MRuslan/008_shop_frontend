// Публичный адрес сайта для canonical, Open Graph, JSON-LD, sitemap и robots.txt

import { env } from '$env/dynamic/public';

/**
 * Адрес берём из PUBLIC_SITE_URL (https://shop.example.ru, без слэша на конце).
 * Запасной вариант — origin запроса: он годится для разработки, но за прокси (nginx)
 * Host часто внутренний (127.0.0.1:3000), а заголовок можно подменить, поэтому в продакшене
 * переменная обязательна
 */
export function siteOrigin(fallback: URL | string): string {
	const configured = env.PUBLIC_SITE_URL?.trim().replace(/\/+$/, '');
	if (configured) return configured;
	return typeof fallback === 'string' ? fallback.replace(/\/+$/, '') : fallback.origin;
}

export function isSiteUrlConfigured(): boolean {
	return !!env.PUBLIC_SITE_URL?.trim();
}
