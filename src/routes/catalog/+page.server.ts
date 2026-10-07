// Server-side загрузка данных для каталога

import { error } from '@sveltejs/kit';
import { productsApi } from '$lib/api/products';
import { categoriesApi } from '$lib/api/categories';
import { throwHttpError } from '$lib/utils/errors';
import type { ProductFilters } from '$lib/types/product';
import { parseSort } from '$lib/utils/sort';

function parsePositiveInt(value: string | null, fallback: number, max = Number.MAX_SAFE_INTEGER) {
	const parsed = Number.parseInt(value ?? '', 10);
	if (!Number.isFinite(parsed) || parsed < 1) return fallback;
	return Math.min(parsed, max);
}

function parseNumber(value: string | null): number | undefined {
	if (value === null || value === '') return undefined;
	const parsed = Number.parseFloat(value);
	return Number.isFinite(parsed) && parsed >= 0 ? parsed : undefined;
}

export async function load({ url }) {
	const page = parsePositiveInt(url.searchParams.get('page'), 1);
	const limit = parsePositiveInt(url.searchParams.get('limit'), 20, 100);
	const search = url.searchParams.get('search')?.trim() || undefined;
	const categoryId = parsePositiveInt(url.searchParams.get('categoryId'), 0) || undefined;
	const minPrice = parseNumber(url.searchParams.get('minPrice'));
	const maxPrice = parseNumber(url.searchParams.get('maxPrice'));
	const inStock = url.searchParams.get('inStock') === 'true' ? true : undefined;
	const { sortBy, sortOrder } = parseSort(url.searchParams);

	const filters: ProductFilters = {
		page,
		limit,
		search,
		categoryId,
		// Родительский раздел показывает и товары подкатегорий, иначе он выглядит пустым
		includeDescendants: categoryId ? true : undefined,
		minPrice,
		maxPrice,
		inStock,
		isActive: true,
		sortBy,
		sortOrder
	};

	// Сбой API — честный 503 (страница ошибки с повтором), а не пустой каталог с кодом 200:
	// иначе поисковик проиндексирует «каталог временно недоступен»
	const [productsResponse, categories] = await Promise.all([
		productsApi.getProducts(filters),
		categoriesApi.getCategories({ tree: true, isActive: true })
	]).catch((err) => throwHttpError(err));

	// Страницы за пределами списка не существуют: 404, а не пустая страница
	if (page > 1 && page > Math.ceil(productsResponse.total / productsResponse.limit)) {
		error(404, 'Такой страницы в каталоге нет');
	}

	return {
		products: productsResponse.data,
		total: productsResponse.total,
		page: productsResponse.page,
		limit: productsResponse.limit,
		categories,
		filters
	};
}
