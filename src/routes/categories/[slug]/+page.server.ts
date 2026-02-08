// Server-side загрузка данных для страницы категории

import { categoriesApi } from '$lib/api/categories';
import { productsApi } from '$lib/api/products';
import { error } from '@sveltejs/kit';
import type { ProductFilters } from '$lib/types/product';

export async function load({ params, url }) {
	const slug = params.slug;
	const page = parseInt(url.searchParams.get('page') || '1');
	const limit = parseInt(url.searchParams.get('limit') || '20');
	const sortBy = (url.searchParams.get('sortBy') as 'price' | 'createAt' | 'name') || 'createAt';
	const sortOrder = (url.searchParams.get('sortOrder') as 'ASC' | 'DESC') || 'DESC';

	try {
		const category = await categoriesApi.getCategoryBySlug(slug);

		const filters: ProductFilters = {
			categoryId: category.id,
			page,
			limit,
			isActive: true,
			sortBy,
			sortOrder
		};

		const productsResponse = await productsApi.getProducts(filters);

		return {
			category,
			products: productsResponse.data,
			total: productsResponse.total,
			page: productsResponse.page,
			limit: productsResponse.limit,
			filters
		};
	} catch (err: any) {
		if (err.statusCode === 404) {
			throw error(404, 'Категория не найдена');
		}
		throw error(500, 'Ошибка загрузки категории');
	}
}
