// Товары для админки: в браузере с токеном, чтобы бэкенд отдал и скрытые товары

import { productsApi } from '$lib/api/products';
import { categoriesApi } from '$lib/api/categories';
import { hasAccessToken } from '$lib/api/client';
import type { Product, Category, ProductFilters } from '$lib/types/product';
import type { PageLoad } from './$types';

export const load: PageLoad = async ({ url }) => {
	const page = Math.max(1, Number(url.searchParams.get('page')) || 1);
	const limit = Math.min(100, Math.max(1, Number(url.searchParams.get('limit')) || 20));
	const search = url.searchParams.get('search') || undefined;
	// 'null' — товары без категории: бэкенд так не фильтрует, отбираем на своей стороне
	const categoryIdParam = url.searchParams.get('categoryId');
	const categoryId = categoryIdParam && categoryIdParam !== 'null' ? Number(categoryIdParam) : undefined;

	const empty = { products: [] as Product[], total: 0, page: 1, limit, categories: [] as Category[] };
	if (!hasAccessToken()) return empty;

	try {
		const filters: ProductFilters = { page, limit, search, isActive: 'all' };
		if (categoryId) filters.categoryId = categoryId;

		const [productsResponse, categories] = await Promise.all([
			productsApi.getProducts(filters, { asStaff: true }),
			categoriesApi.getCategories({ tree: true, isActive: 'all' }, { asStaff: true })
		]);

		const withoutCategory = categoryIdParam === 'null';
		const products = withoutCategory
			? productsResponse.data.filter((product) => product.categoryId === null)
			: productsResponse.data;

		return {
			products,
			total: withoutCategory ? products.length : productsResponse.total,
			page: productsResponse.page,
			limit: productsResponse.limit,
			categories
		};
	} catch (error) {
		console.error('Failed to load products:', error);
		return empty;
	}
};
