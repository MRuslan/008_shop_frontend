// Серверные хуки SvelteKit

import type { Handle } from '@sveltejs/kit';
import { dev } from '$app/environment';
import { isNoindexPath } from '$lib/utils/robots';
import { isSiteUrlConfigured } from '$lib/utils/site';
import { SESSION_ENDED_HEADER } from '$lib/utils/constants';
import { restoreSession } from '$lib/server/session';

// Без PUBLIC_SITE_URL canonical, sitemap и robots.txt строятся от заголовка Host. За прокси это
// внутренний адрес (127.0.0.1:3000), и поисковик получит неверные ссылки. Предупреждаем один раз
if (!dev && !isSiteUrlConfigured()) {
	console.warn(
		'[seo] PUBLIC_SITE_URL не задан: canonical и sitemap будут строиться от заголовка Host. ' +
			'Укажите публичный адрес сайта, например PUBLIC_SITE_URL=https://shop.example.ru'
	);
}

// adapter-node сжимает только статику из build/client; HTML страниц и __data.json уходят как есть.
// Каталог весит ~95 КБ HTML и ~11 КБ в gzip: на мобильной сети это заметные доли секунды.
const COMPRESSIBLE = /^(text\/html|application\/json|application\/xml|text\/plain)/;

// Заголовки некоторых ответов (например, редиректов) неизменяемы: тогда собираем ответ заново
function withHeader(response: Response, name: string, value: string): Response {
	try {
		response.headers.set(name, value);
		return response;
	} catch {
		const headers = new Headers(response.headers);
		headers.set(name, value);
		return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
	}
}

export const handle: Handle = async ({ event, resolve }) => {
	// Вход посетителя из httpOnly-cookie; истекающий access-токен обновляется здесь, до загрузки страницы
	await restoreSession(event);

	let response = await resolve(event, {
		// Universal load кабинета и админки при SSR ходят в свой /api, а клиент API читает content-type ответа
		filterSerializedResponseHeaders: (name) => name === 'content-type'
	});

	// Входа больше нет (продлить не удалось или cookie стёр выход в соседней вкладке):
	// браузер по этому заголовку перестаёт считать пользователя вошедшим
	if (event.locals.sessionEnded) {
		response = withHeader(response, SESSION_ENDED_HEADER, '1');
	}

	// Личные и служебные страницы закрыты от индексации заголовком: он работает и для ответов /api,
	// и для страниц без своего <meta name="robots">. Страхует корзину, оформление и поиск
	if (isNoindexPath(event.url.pathname)) {
		response = withHeader(response, 'x-robots-tag', 'noindex, nofollow');
	}

	const type = response.headers.get('content-type') ?? '';
	const accepts = event.request.headers.get('accept-encoding') ?? '';
	if (
		!response.body ||
		!COMPRESSIBLE.test(type) ||
		response.headers.has('content-encoding') ||
		!/\bgzip\b/.test(accepts)
	) {
		return response;
	}

	const headers = new Headers(response.headers);
	headers.set('content-encoding', 'gzip');
	headers.delete('content-length');
	headers.append('vary', 'Accept-Encoding');

	return new Response(response.body.pipeThrough(new CompressionStream('gzip')), {
		status: response.status,
		statusText: response.statusText,
		headers
	});
};
