// Server-side загрузка категорий для админ-панели

import { categoriesApi } from '$lib/api/categories';

export async function load() {
	try {
		const categories = await categoriesApi.getCategories({ tree: true });
		return {
			categories
		};
	} catch (error) {
		console.error('Failed to load categories:', error);
		return {
			categories: []
		};
	}
}
