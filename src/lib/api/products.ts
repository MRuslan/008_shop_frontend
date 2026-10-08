// API методы для товаров

import { apiClient, type LoadOptions } from './client';
import type {
	Product,
	ProductsResponse,
	ProductFilters,
	ProductImage,
	ProductStock
} from '$lib/types/product';

/** Сотрудник запрашивает со своим входом: бэкенд тогда отдаёт и скрытые товары */
interface StaffOption extends LoadOptions {
	asStaff?: boolean;
}

export const productsApi = {
	/**
	 * Получить список товаров с фильтрами
	 */
	async getProducts(filters?: ProductFilters, options: StaffOption = {}): Promise<ProductsResponse> {
		const params = new URLSearchParams();
		
		if (filters?.search) params.append('search', filters.search);
		// Передаем categoryId только если это число (не null и не undefined)
		// Бэкенд не поддерживает фильтрацию по null напрямую
		if (filters?.categoryId !== undefined && filters.categoryId !== null) {
			params.append('categoryId', filters.categoryId.toString());
			if (filters.includeDescendants) params.append('includeDescendants', 'true');
		}
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
		
		return apiClient.get<ProductsResponse>(endpoint, { fetch: options.fetch, skipAuth: !options.asStaff });
	},

	/**
	 * Получить товар по ID: с характеристиками, фото и остатками по точкам
	 */
	async getProductById(id: number, options: StaffOption = {}): Promise<Product> {
		return apiClient.get<Product>(`/products/${id}`, { skipAuth: !options.asStaff });
	},

	/**
	 * Задать остаток на точке (абсолютное значение). Сумма product.quantity пересчитается сама
	 */
	async setStock(productId: number, locationId: number, quantity: number): Promise<ProductStock> {
		return apiClient.put<ProductStock>(`/products/${productId}/stocks/${locationId}`, { quantity });
	},

	/**
	 * Загрузить фото: бэкенд сожмёт его в WebP и сделает превью
	 */
	async uploadImage(productId: number, file: File, sortOrder?: number): Promise<ProductImage> {
		const form = new FormData();
		form.append('file', file);
		if (sortOrder !== undefined) form.append('sortOrder', String(sortOrder));
		return apiClient.upload<ProductImage>(`/products/${productId}/images`, form);
	},

	/**
	 * Удалить фото вместе с файлами
	 */
	async deleteImage(productId: number, imageId: number): Promise<void> {
		return apiClient.delete<void>(`/products/${productId}/images/${imageId}`);
	},

	/**
	 * Получить товар по slug
	 */
	async getProductBySlug(slug: string): Promise<Product> {
		return apiClient.get<Product>(`/products/slug/${slug}`, { skipAuth: true });
	},

	/**
	 * Создать товар (для manager/admin)
	 */
	async createProduct(data: Partial<Product>): Promise<Product> {
		return apiClient.post<Product>('/products', data);
	},

	/**
	 * Обновить товар (для manager/admin)
	 */
	async updateProduct(id: number, data: Partial<Product>): Promise<Product> {
		return apiClient.patch<Product>(`/products/${id}`, data);
	},

	/**
	 * Удалить товар (для manager/admin)
	 */
	async deleteProduct(id: number): Promise<void> {
		return apiClient.delete<void>(`/products/${id}`);
	}
};
