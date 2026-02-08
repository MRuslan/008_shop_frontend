// Типы для товаров и категорий

export interface Category {
	id: number;
	name: string;
	slug: string;
	parentId: number | null;
	sortOrder: number;
	isActive: boolean;
	createAt: string;
	updateAt: string;
	parent?: Category;
	children?: Category[];
}

export interface ProductImage {
	url: string;
	sortOrder?: number;
}

export interface Product {
	id: number;
	name: string;
	slug: string;
	description: string | null;
	price: string; // decimal как строка
	compareAtPrice: string | null;
	sku: string | null;
	quantity: number;
	categoryId: number | null;
	isActive: boolean;
	createAt: string;
	updateAt: string;
	category?: Category | null;
	images?: ProductImage[];
}

export interface ProductsResponse {
	data: Product[];
	total: number;
	page: number;
	limit: number;
}

export interface ProductFilters {
	search?: string;
	categoryId?: number | null; // null означает товары без категорий
	minPrice?: number;
	maxPrice?: number;
	inStock?: boolean;
	isActive?: boolean;
	sortBy?: 'price' | 'createAt' | 'name';
	sortOrder?: 'ASC' | 'DESC';
	page?: number;
	limit?: number;
}
