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
	id?: number;
	url: string;
	/** Превью до 400 px у загруженных файлов; у внешних ссылок null */
	thumbnailUrl?: string | null;
	width?: number | null;
	height?: number | null;
	sortOrder?: number;
}

export interface ProductAttribute {
	id: number;
	productId: number;
	name: string;
	value: string;
	unit: string | null;
	sortOrder: number;
}

/** Остаток товара на точке; точки без строки означают 0 */
export interface ProductStock {
	id: number;
	productId: number;
	locationId: number;
	quantity: number;
	location?: import('./order').Location;
}

export interface Product {
	id: number;
	name: string;
	slug: string;
	description: string | null;
	price: string; // decimal как строка
	compareAtPrice: string | null;
	sku: string | null;
	/** Сумма остатков по всем точкам */
	quantity: number;
	categoryId: number | null;
	isActive: boolean;
	/** Средняя оценка строкой ("4.50"); null, пока нет отзывов */
	ratingAvg?: string | null;
	ratingCount?: number;
	createAt: string;
	updateAt: string;
	category?: Category | null;
	images?: ProductImage[];
	/** Только в карточке товара, не в списке */
	attributes?: ProductAttribute[];
	stocks?: ProductStock[];
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
	/** Вместе с categoryId: товары категории и всех её подкатегорий */
	includeDescendants?: boolean;
	minPrice?: number;
	maxPrice?: number;
	inStock?: boolean;
	/** 'all' — активные и скрытые, только для сотрудника с токеном */
	isActive?: boolean | 'all';
	sortBy?: 'price' | 'createAt' | 'name' | 'rating';
	sortOrder?: 'ASC' | 'DESC';
	page?: number;
	limit?: number;
}
