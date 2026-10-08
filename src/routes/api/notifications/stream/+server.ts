// Поток уведомлений (SSE) от бэкенда к браузеру. Общий прокси /api не годится: он ограничивает
// запрос по времени и читает ответ целиком, а поток живёт, пока открыта вкладка

import { upstreamUrl, clientHeaders } from '$lib/server/upstream';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async (event) => {
	const token = event.locals.accessToken;
	if (!token) return new Response(null, { status: 401 });

	let upstream: Response;
	try {
		upstream = await fetch(upstreamUrl('notifications/stream'), {
			headers: { ...clientHeaders(event), accept: 'text/event-stream', authorization: `Bearer ${token}` },
			// Вкладку закрыли или ушли со страницы: закрываем и соединение с бэкендом
			signal: event.request.signal
		});
	} catch {
		return new Response(null, { status: 503 });
	}

	// 404 — бэкенд ещё без уведомлений, 401 — вход истёк: браузер не будет переподключаться к ошибке
	if (!upstream.ok || !upstream.body || !upstream.headers.get('content-type')?.startsWith('text/event-stream')) {
		await upstream.body?.cancel();
		return new Response(null, { status: upstream.ok ? 502 : upstream.status });
	}

	return new Response(upstream.body, {
		headers: {
			'content-type': 'text/event-stream; charset=utf-8',
			'cache-control': 'no-cache, no-transform',
			// nginx иначе копит поток в буфере, и события приходят пачками
			'x-accel-buffering': 'no'
		}
	});
};
