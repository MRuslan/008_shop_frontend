// Генерация sitemap.xml

import { productsApi } from '$lib/api/products';
import { categoriesApi } from '$lib/api/categories';
import type { RequestHandler } from '@sveltejs/kit';

export const GET: RequestHandler = async ({ url }) => {
	const baseUrl = url.origin;
	const urls: string[] = [];

	try {
		// Главная страница
		urls.push(baseUrl);
		urls.push(`${baseUrl}/catalog`);

		// Получаем все категории
		const categories = await categoriesApi.getCategories({ tree: true, isActive: true });
		
		for (const category of categories) {
			urls.push(`${baseUrl}/categories/${category.slug}`);
			
			// Добавляем дочерние категории
			if (category.children) {
				for (const child of category.children) {
					if (child.isActive) {
						urls.push(`${baseUrl}/categories/${child.slug}`);
					}
				}
			}
		}

		// Получаем все активные товары (постранично)
		let page = 1;
		const limit = 100;
		let hasMore = true;

		while (hasMore) {
			try {
				const response = await productsApi.getProducts({
					page,
					limit,
					isActive: true
				});

				for (const product of response.data) {
					urls.push(`${baseUrl}/products/${product.slug}`);
				}

				hasMore = response.data.length === limit;
				page++;
			} catch (error) {
				console.error('Error fetching products for sitemap:', error);
				hasMore = false;
			}
		}
	} catch (error) {
		console.error('Error generating sitemap:', error);
	}

	// Генерируем XML
	const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
	.map(
		(url) => `  <url>
    <loc>${url}</loc>
    <changefreq>weekly</changefreq>
    <priority>${url === baseUrl ? '1.0' : url.includes('/products/') ? '0.8' : '0.6'}</priority>
  </url>`
	)
	.join('\n')}
</urlset>`;

	return new Response(sitemap, {
		headers: {
			'Content-Type': 'application/xml; charset=utf-8',
			'Cache-Control': 'public, max-age=3600' // Кэшируем на 1 час
		}
	});
};
