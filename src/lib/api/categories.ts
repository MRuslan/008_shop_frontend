// API методы для категорий

import { apiClient } from './client';
import type { Category } from '$lib/types/product';

export interface CategoriesQuery {
	tree?: boolean;
	isActive?: boolean;
	sortBy?: 'name' | 'sortOrder' | 'createAt';
	sortOrder?: 'ASC' | 'DESC';
}

export const categoriesApi = {
	/**
	 * Получить список категорий
	 */
	async getCategories(query?: CategoriesQuery): Promise<Category[]> {
		const params = new URLSearchParams();
		
		if (query?.tree !== undefined) params.append('tree', query.tree.toString());
		if (query?.isActive !== undefined) params.append('isActive', query.isActive.toString());
		if (query?.sortBy) params.append('sortBy', query.sortBy);
		if (query?.sortOrder) params.append('sortOrder', query.sortOrder);

		const queryString = params.toString();
		const endpoint = queryString ? `/categories?${queryString}` : '/categories';
		
		return apiClient.get<Category[]>(endpoint, { skipAuth: true });
	},

	/**
	 * Получить категорию по ID
	 */
	async getCategoryById(id: number): Promise<Category> {
		return apiClient.get<Category>(`/categories/${id}`, { skipAuth: true });
	},

	/**
	 * Получить категорию по slug
	 */
	async getCategoryBySlug(slug: string): Promise<Category> {
		return apiClient.get<Category>(`/categories/slug/${slug}`, { skipAuth: true });
	}
};
