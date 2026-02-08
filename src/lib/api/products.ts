// API методы для товаров

import { apiClient } from './client';
import type {
	Product,
	ProductsResponse,
	ProductFilters
} from '$lib/types/product';

export const productsApi = {
	/**
	 * Получить список товаров с фильтрами
	 */
	async getProducts(filters?: ProductFilters): Promise<ProductsResponse> {
		const params = new URLSearchParams();
		
		if (filters?.search) params.append('search', filters.search);
		if (filters?.categoryId) params.append('categoryId', filters.categoryId.toString());
		if (filters?.minPrice) params.append('minPrice', filters.minPrice.toString());
		if (filters?.maxPrice) params.append('maxPrice', filters.maxPrice.toString());
		if (filters?.inStock !== undefined) params.append('inStock', filters.inStock.toString());
		if (filters?.isActive !== undefined) params.append('isActive', filters.isActive.toString());
		if (filters?.sortBy) params.append('sortBy', filters.sortBy);
		if (filters?.sortOrder) params.append('sortOrder', filters.sortOrder);
		if (filters?.page) params.append('page', filters.page.toString());
		if (filters?.limit) params.append('limit', filters.limit.toString());

		const query = params.toString();
		const endpoint = query ? `/products?${query}` : '/products';
		
		return apiClient.get<ProductsResponse>(endpoint, { skipAuth: true });
	},

	/**
	 * Получить товар по ID
	 */
	async getProductById(id: number): Promise<Product> {
		return apiClient.get<Product>(`/products/${id}`, { skipAuth: true });
	},

	/**
	 * Получить товар по slug
	 */
	async getProductBySlug(slug: string): Promise<Product> {
		return apiClient.get<Product>(`/products/slug/${slug}`, { skipAuth: true });
	}
};
