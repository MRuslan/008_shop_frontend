// Server-side загрузка данных для каталога

import { productsApi } from '$lib/api/products';
import { categoriesApi } from '$lib/api/categories';
import { getErrorMessage } from '$lib/utils/errors';
import type { ProductFilters } from '$lib/types/product';

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
	const sortBy = (url.searchParams.get('sortBy') as 'price' | 'createAt' | 'name') || 'createAt';
	const sortOrder = (url.searchParams.get('sortOrder') as 'ASC' | 'DESC') || 'DESC';

	const filters: ProductFilters = {
		page,
		limit,
		search,
		categoryId,
		minPrice,
		maxPrice,
		inStock,
		isActive: true,
		sortBy,
		sortOrder
	};

	try {
		const [productsResponse, categories] = await Promise.all([
			productsApi.getProducts(filters),
			categoriesApi.getCategories({ tree: true, isActive: true })
		]);

		return {
			products: productsResponse.data,
			total: productsResponse.total,
			page: productsResponse.page,
			limit: productsResponse.limit,
			categories,
			filters,
			loadError: null as string | null
		};
	} catch (err) {
		console.error('Failed to load catalog:', err);
		// Не выдаём пустую страницу «Товары не найдены» за успех: страница покажет ошибку и кнопку повтора
		return {
			products: [],
			total: 0,
			page,
			limit,
			categories: [],
			filters,
			loadError: getErrorMessage(err, 'Каталог временно недоступен. Попробуйте обновить страницу.')
		};
	}
}
