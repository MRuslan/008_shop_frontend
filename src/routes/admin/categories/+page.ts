// Категории для админки: в браузере с токеном, чтобы видеть и скрытые

import { categoriesApi } from '$lib/api/categories';
import { hasAccessToken } from '$lib/api/client';
import type { Category } from '$lib/types/product';
import type { PageLoad } from './$types';

export const load: PageLoad = async () => {
	if (!hasAccessToken()) return { categories: [] as Category[] };
	try {
		const categories = await categoriesApi.getCategories({ tree: true, isActive: 'all' }, { asStaff: true });
		return { categories };
	} catch (error) {
		console.error('Failed to load categories:', error);
		return { categories: [] as Category[] };
	}
};
