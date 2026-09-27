// Серверные хуки SvelteKit

import type { Handle } from '@sveltejs/kit';

// adapter-node сжимает только статику из build/client; HTML страниц и __data.json уходят как есть.
// Каталог весит ~95 КБ HTML и ~11 КБ в gzip: на мобильной сети это заметные доли секунды.
const COMPRESSIBLE = /^(text\/html|application\/json|text\/plain)/;

export const handle: Handle = async ({ event, resolve }) => {
	const response = await resolve(event);

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
