// Server-side загрузка данных для каталога

import { productsApi } from '$lib/api/products';
import { categoriesApi } from '$lib/api/categories';
import type { ProductFilters } from '$lib/types/product';

export async function load({ url }) {
	const page = parseInt(url.searchParams.get('page') || '1');
	const limit = parseInt(url.searchParams.get('limit') || '20');
	const search = url.searchParams.get('search') || undefined;
	const categoryId = url.searchParams.get('categoryId')
		? parseInt(url.searchParams.get('categoryId')!)
		: undefined;
	const minPrice = url.searchParams.get('minPrice')
		? parseFloat(url.searchParams.get('minPrice')!)
		: undefined;
	const maxPrice = url.searchParams.get('maxPrice')
		? parseFloat(url.searchParams.get('maxPrice')!)
		: undefined;
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
			filters
		};
	} catch (error) {
		console.error('Failed to load catalog:', error);
		return {
			products: [],
			total: 0,
			page: 1,
			limit: 20,
			categories: [],
			filters
		};
	}
}
