// Server-side загрузка товаров для админ-панели

import { productsApi } from '$lib/api/products';
import { categoriesApi } from '$lib/api/categories';

export async function load({ url }) {
	const page = parseInt(url.searchParams.get('page') || '1');
	const limit = parseInt(url.searchParams.get('limit') || '20');
	const search = url.searchParams.get('search') || undefined;
	const categoryId = url.searchParams.get('categoryId')
		? parseInt(url.searchParams.get('categoryId')!)
		: undefined;

	try {
		const [productsResponse, categories] = await Promise.all([
			productsApi.getProducts({
				page,
				limit,
				search,
				categoryId,
				isActive: undefined // Показываем все товары
			}),
			categoriesApi.getCategories({ tree: true })
		]);

		return {
			products: productsResponse.data,
			total: productsResponse.total,
			page: productsResponse.page,
			limit: productsResponse.limit,
			categories
		};
	} catch (error) {
		console.error('Failed to load products:', error);
		return {
			products: [],
			total: 0,
			page: 1,
			limit: 20,
			categories: []
		};
	}
}
