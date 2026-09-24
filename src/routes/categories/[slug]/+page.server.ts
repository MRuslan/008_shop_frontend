// Server-side загрузка данных для страницы категории

import { categoriesApi } from '$lib/api/categories';
import { productsApi } from '$lib/api/products';
import { throwHttpError } from '$lib/utils/errors';
import type { ProductFilters } from '$lib/types/product';

function parsePositiveInt(value: string | null, fallback: number, max = Number.MAX_SAFE_INTEGER) {
	const parsed = Number.parseInt(value ?? '', 10);
	if (!Number.isFinite(parsed) || parsed < 1) return fallback;
	return Math.min(parsed, max);
}

export async function load({ params, url }) {
	const page = parsePositiveInt(url.searchParams.get('page'), 1);
	const limit = parsePositiveInt(url.searchParams.get('limit'), 20, 100);
	const sortBy = (url.searchParams.get('sortBy') as 'price' | 'createAt' | 'name') || 'createAt';
	const sortOrder = (url.searchParams.get('sortOrder') as 'ASC' | 'DESC') || 'DESC';

	// 404 остаётся 404, недоступный бэкенд превращается в 503, а не в «500 Ошибка загрузки»
	const category = await categoriesApi
		.getCategoryBySlug(params.slug)
		.catch((err) => throwHttpError(err, { notFound: 'Категория не найдена' }));

	const filters: ProductFilters = {
		categoryId: category.id,
		page,
		limit,
		isActive: true,
		sortBy,
		sortOrder
	};

	const productsResponse = await productsApi
		.getProducts(filters)
		.catch((err) => throwHttpError(err));

	return {
		category,
		products: productsResponse.data,
		total: productsResponse.total,
		page: productsResponse.page,
		limit: productsResponse.limit,
		filters
	};
}
