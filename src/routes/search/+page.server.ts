// Server-side загрузка данных для страницы поиска

import { productsApi } from '$lib/api/products';
import { getErrorMessage } from '$lib/utils/errors';
import type { ProductFilters } from '$lib/types/product';

function parsePositiveInt(value: string | null, fallback: number, max = Number.MAX_SAFE_INTEGER) {
	const parsed = Number.parseInt(value ?? '', 10);
	if (!Number.isFinite(parsed) || parsed < 1) return fallback;
	return Math.min(parsed, max);
}

export async function load({ url }) {
	const query = (url.searchParams.get('q') || '').trim();
	const page = parsePositiveInt(url.searchParams.get('page'), 1);
	const limit = parsePositiveInt(url.searchParams.get('limit'), 20, 100);
	const sortBy = (url.searchParams.get('sortBy') as 'price' | 'createAt' | 'name') || 'createAt';
	const sortOrder = (url.searchParams.get('sortOrder') as 'ASC' | 'DESC') || 'DESC';

	const filters: ProductFilters = {
		search: query || undefined,
		page,
		limit,
		isActive: true,
		sortBy,
		sortOrder
	};

	if (!query) {
		return {
			query: '',
			products: [],
			total: 0,
			page: 1,
			limit,
			filters,
			loadError: null as string | null
		};
	}

	try {
		const productsResponse = await productsApi.getProducts(filters);

		return {
			query,
			products: productsResponse.data,
			total: productsResponse.total,
			page: productsResponse.page,
			limit: productsResponse.limit,
			filters,
			loadError: null as string | null
		};
	} catch (err) {
		console.error('Failed to search products:', err);
		return {
			query,
			products: [],
			total: 0,
			page,
			limit,
			filters,
			loadError: getErrorMessage(err, 'Поиск временно недоступен. Попробуйте обновить страницу.')
		};
	}
}
