// Server-side загрузка данных для страницы категории

import { categoriesApi } from '$lib/api/categories';
import { productsApi } from '$lib/api/products';
import { error } from '@sveltejs/kit';
import { throwHttpError } from '$lib/utils/errors';
import type { ProductFilters } from '$lib/types/product';
import { parseSort } from '$lib/utils/sort';

function parsePositiveInt(value: string | null, fallback: number, max = Number.MAX_SAFE_INTEGER) {
	const parsed = Number.parseInt(value ?? '', 10);
	if (!Number.isFinite(parsed) || parsed < 1) return fallback;
	return Math.min(parsed, max);
}

export async function load({ params, url }) {
	const page = parsePositiveInt(url.searchParams.get('page'), 1);
	const limit = parsePositiveInt(url.searchParams.get('limit'), 20, 100);
	const { sortBy, sortOrder } = parseSort(url.searchParams);

	// 404 остаётся 404, недоступный бэкенд превращается в 503, а не в «500 Ошибка загрузки»
	const category = await categoriesApi
		.getCategoryBySlug(params.slug)
		.catch((err) => throwHttpError(err, { notFound: 'Категория не найдена' }));

	const filters: ProductFilters = {
		categoryId: category.id,
		// Родительский раздел показывает и товары подкатегорий, иначе он выглядит пустым
		includeDescendants: true,
		page,
		limit,
		isActive: true,
		sortBy,
		sortOrder
	};

	// Соседние разделы нужны для чипсов, когда у категории нет своих подкатегорий
	const [productsResponse, parent] = await Promise.all([
		productsApi.getProducts(filters).catch((err) => throwHttpError(err)),
		!category.children?.length && category.parentId
			? categoriesApi.getCategoryById(category.parentId).catch(() => null)
			: Promise.resolve(null)
	]);

	// Страницы за пределами списка не существуют: 404, а не пустая страница
	if (page > 1 && page > Math.ceil(productsResponse.total / productsResponse.limit)) {
		error(404, 'Такой страницы в разделе нет');
	}

	return {
		category,
		parent,
		products: productsResponse.data,
		total: productsResponse.total,
		page: productsResponse.page,
		limit: productsResponse.limit,
		filters
	};
}
