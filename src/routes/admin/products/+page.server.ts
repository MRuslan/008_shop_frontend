// Server-side загрузка товаров для админ-панели

import { productsApi } from '$lib/api/products';
import { categoriesApi } from '$lib/api/categories';

export async function load({ url }) {
	const page = parseInt(url.searchParams.get('page') || '1');
	const limit = parseInt(url.searchParams.get('limit') || '20');
	const search = url.searchParams.get('search') || undefined;
	
	// Обработка фильтра по категории
	const categoryIdParam = url.searchParams.get('categoryId');
	let categoryId: number | undefined;
	
	// Если параметр 'null' - это означает фильтр по товарам без категорий
	// Но бэкенд не поддерживает это напрямую, поэтому получим все товары и отфильтруем на клиенте
	// Если передан числовой ID - используем его
	if (categoryIdParam && categoryIdParam !== 'null') {
		categoryId = parseInt(categoryIdParam);
	}

	try {
		// Формируем фильтры для API
		const filters: any = {
			page,
			limit,
			search
			// Не передаем isActive, чтобы получить все товары (и активные, и неактивные)
		};
		console.log("filters", filters);
		
		// Передаем categoryId только если это число
		if (categoryId !== undefined) {
			filters.categoryId = categoryId;
		}
		
		const [productsResponse, categories] = await Promise.all([
			productsApi.getProducts(filters),
			categoriesApi.getCategories({ tree: true })
		]);
		
		// Если запрошены товары без категорий (categoryIdParam === 'null'),
		// фильтруем результаты на сервере
		let filteredProducts = productsResponse?.data || [];
		if (categoryIdParam === 'null') {
			filteredProducts = filteredProducts.filter(p => p.categoryId === null);
		}

		console.log('Products loaded:', {
			count: filteredProducts.length,
			total: categoryIdParam === 'null' ? filteredProducts.length : (productsResponse?.total || 0),
			page: productsResponse?.page || 1
		});

		return {
			products: filteredProducts,
			total: categoryIdParam === 'null' ? filteredProducts.length : (productsResponse?.total || 0),
			page: productsResponse?.page || 1,
			limit: productsResponse?.limit || 20,
			categories: categories || []
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
