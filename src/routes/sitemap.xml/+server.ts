// Генерация sitemap.xml: главная, каталог, контакты, все разделы и все активные товары

import { productsApi } from '$lib/api/products';
import { categoriesApi } from '$lib/api/categories';
import { siteOrigin } from '$lib/utils/site';
import type { Category } from '$lib/types/product';
import type { RequestHandler } from '@sveltejs/kit';

interface Entry {
	path: string;
	lastmod?: string;
}

// Защита от бесконечного цикла, если бэкенд вдруг начнёт врать о total: до 50 000 товаров
const MAX_PRODUCT_PAGES = 500;

function escapeXml(value: string): string {
	return value
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&apos;');
}

function day(date: string | undefined): string | undefined {
	return date ? date.split('T')[0] : undefined;
}

// Дерево разделов любой глубины в плоский список
function flatten(categories: Category[]): Category[] {
	return categories.flatMap((category) => [category, ...flatten(category.children ?? [])]);
}

export const GET: RequestHandler = async ({ url }) => {
	const origin = siteOrigin(url);

	try {
		// Главная со слэшем — так же, как в её canonical
		const entries: Entry[] = [{ path: '/' }, { path: '/catalog' }, { path: '/contacts' }];

		const categories = await categoriesApi.getCategories({ tree: true, isActive: true });
		for (const category of flatten(categories)) {
			if (category.isActive === false) continue;
			entries.push({ path: `/categories/${category.slug}`, lastmod: day(category.updateAt) });
		}

		let collected = 0;
		for (let page = 1; page <= MAX_PRODUCT_PAGES; page++) {
			const response = await productsApi.getProducts({ page, limit: 100, isActive: true });
			for (const product of response.data) {
				entries.push({ path: `/products/${product.slug}`, lastmod: day(product.updateAt) });
			}
			collected += response.data.length;
			if (response.data.length === 0 || collected >= response.total) break;
		}

		const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries
	.map(
		(entry) =>
			`  <url>\n    <loc>${escapeXml(origin + encodeURI(entry.path))}</loc>${
				entry.lastmod ? `\n    <lastmod>${entry.lastmod}</lastmod>` : ''
			}\n  </url>`
	)
	.join('\n')}
</urlset>
`;

		return new Response(body, {
			headers: {
				'Content-Type': 'application/xml; charset=utf-8',
				'Cache-Control': 'public, max-age=3600'
			}
		});
	} catch (error) {
		// Неполный sitemap с кодом 200 поисковик принял бы за правду и выкинул бы товары из индекса.
		// 503 значит «зайди позже», прежняя версия у него останется
		console.error('Error generating sitemap:', error);
		return new Response('Sitemap временно недоступен', {
			status: 503,
			headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Retry-After': '600', 'Cache-Control': 'no-store' }
		});
	}
};
