// Server-side загрузка данных для страницы поиска

import { productsApi } from '$lib/api/products';
import type { ProductFilters } from '$lib/types/product';

export async function load({ url }) {
	const query = url.searchParams.get('q') || '';
	const page = parseInt(url.searchParams.get('page') || '1');
	const limit = parseInt(url.searchParams.get('limit') || '20');
	const sortBy = (url.searchParams.get('sortBy') as 'price' | 'createAt' | 'name') || 'createAt';
	const sortOrder = (url.searchParams.get('sortOrder') as 'ASC' | 'DESC') || 'DESC';

	if (!query.trim()) {
		return {
			query: '',
			products: [],
			total: 0,
			page: 1,
			limit: 20,
			filters: {
				search: undefined,
				page: 1,
				limit: 20,
				isActive: true,
				sortBy: 'createAt',
				sortOrder: 'DESC'
			}
		};
	}

	const filters: ProductFilters = {
		search: query,
		page,
		limit,
		isActive: true,
		sortBy,
		sortOrder
	};

	try {
		const productsResponse = await productsApi.getProducts(filters);

		return {
			query,
			products: productsResponse.data,
			total: productsResponse.total,
			page: productsResponse.page,
			limit: productsResponse.limit,
			filters
		};
	} catch (error) {
		console.error('Failed to search products:', error);
		return {
			query,
			products: [],
			total: 0,
			page: 1,
			limit: 20,
			filters
		};
	}
}
