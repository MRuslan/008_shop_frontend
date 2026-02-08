// Server-side загрузка данных для страницы товара (SSR для SEO)

import { productsApi } from '$lib/api/products';
import { categoriesApi } from '$lib/api/categories';
import { error } from '@sveltejs/kit';

export async function load({ params }) {
	const slug = params.slug;

	try {
		const product = await productsApi.getProductBySlug(slug);

		if (!product.isActive) {
			throw error(404, 'Товар не найден');
		}

		// Загружаем категорию, если есть
		let category = null;
		if (product.categoryId) {
			try {
				category = await categoriesApi.getCategoryById(product.categoryId);
			} catch (err) {
				// Игнорируем ошибку, если категория не найдена
			}
		}

		return {
			product,
			category
		};
	} catch (err: any) {
		if (err.statusCode === 404) {
			throw error(404, 'Товар не найден');
		}
		throw error(500, 'Ошибка загрузки товара');
	}
}
