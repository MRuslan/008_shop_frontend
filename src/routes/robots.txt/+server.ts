// robots.txt собирается от адреса сайта (PUBLIC_SITE_URL), чтобы ссылка на sitemap была настоящей

import type { RequestHandler } from './$types';
import { siteOrigin } from '$lib/utils/site';
import { NOINDEX_PREFIXES } from '$lib/utils/robots';

export const GET: RequestHandler = ({ url }) => {
	const origin = siteOrigin(url);
	// Правило без слэша на конце закрывает и сам раздел (/account), и всё внутри (/account/orders)
	const disallow = NOINDEX_PREFIXES.map((prefix) => `Disallow: ${prefix}`).join('\n');

	const body = `User-agent: *
Allow: /
${disallow}
# Варианты сортировки — та же страница каталога
Disallow: /*?*sortBy=

Sitemap: ${origin}/sitemap.xml
`;

	return new Response(body, {
		headers: {
			'Content-Type': 'text/plain; charset=utf-8',
			'Cache-Control': 'public, max-age=3600'
		}
	});
};
