// Server-side загрузка данных для страницы товара (SSR для SEO)

import { error } from '@sveltejs/kit';
import { productsApi } from '$lib/api/products';
import { categoriesApi } from '$lib/api/categories';
import { throwHttpError } from '$lib/utils/errors';
import type { Category } from '$lib/types/product';

export async function load({ params }) {
	// 404 остаётся 404, недоступный бэкенд превращается в 503, а не в «500 Ошибка загрузки»
	const product = await productsApi
		.getProductBySlug(params.slug)
		.catch((err) => throwHttpError(err, { notFound: 'Товар не найден' }));

	if (!product.isActive) {
		error(404, 'Товар не найден');
	}

	// Категория нужна только для крошек: её отсутствие не должно ломать страницу
	let category: Category | null = null;
	if (product.categoryId) {
		try {
			category = await categoriesApi.getCategoryById(product.categoryId);
		} catch {
			category = null;
		}
	}

	return { product, category };
}
