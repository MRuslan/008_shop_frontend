// Категории для админки со входом сотрудника, чтобы видеть и скрытые

import { categoriesApi } from '$lib/api/categories';
import type { Category } from '$lib/types/product';
import type { PageLoad } from './$types';

export const load: PageLoad = async ({ fetch }) => {
	try {
		const categories = await categoriesApi.getCategories({ tree: true, isActive: 'all' }, { asStaff: true, fetch });
		return { categories };
	} catch (error) {
		console.error('Failed to load categories:', error);
		return { categories: [] as Category[] };
	}
};
