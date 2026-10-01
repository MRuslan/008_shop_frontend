// Общие типы

export interface Store {
	id: number;
	name: string;
	slug: string;
	logoUrl: string | null;
	faviconUrl: string | null;
	contactEmail: string | null;
	contactPhone: string | null;
	legalName: string | null;
	inn: string | null;
	legalAddress: string | null;
	currency: string;
	timezone: string;
	locale: string;
	isActive: boolean;
	/** Бэкенд всегда отдаёт полный объект, недостающее заполняет значениями по умолчанию */
	settings: StoreSettings | null;
	createAt: string;
	updateAt: string;
}

export interface StoreSettings {
	delivery: {
		enabled: boolean;
		price: string;
		/** Доставка бесплатна от этой суммы товаров после скидки; null — порога нет */
		freeFrom: string | null;
		/** Минимальная сумма товаров после скидки для доставки; null — минимума нет */
		minOrderAmount: string | null;
	};
	pickup: { enabled: boolean };
	/** Ссылки подвала: URL или путь фронтенда; null убирает ссылку */
	pages: { about: string | null; privacy: string | null; terms: string | null };
}

export interface Address {
	id: number;
	userId: number;
	label: string;
	city: string;
	street: string;
	building: string;
	apartment: string | null;
	postalCode: string | null;
	phone: string;
	isDefault: boolean;
	createAt: string;
	updateAt: string;
}

export interface CreateAddressDto {
	label: string;
	city: string;
	street: string;
	building: string;
	apartment?: string;
	postalCode?: string;
	phone: string;
	isDefault?: boolean;
}

export interface UpdateAddressDto {
	label?: string;
	city?: string;
	street?: string;
	building?: string;
	apartment?: string;
	postalCode?: string;
	phone?: string;
	isDefault?: boolean;
}

export interface Review {
	id: number;
	userId: number;
	productId: number;
	rating: number;
	text: string | null;
	moderatedBy: number | null;
	isVisible: boolean;
	createAt: string;
	user?: {
		id: number;
		username: string;
		email: string;
	};
}

export interface CreateReviewDto {
	productId: number;
	rating: number;
	text?: string;
}

export interface WishlistItem {
	id: number;
	userId: number;
	productId: number;
	createAt: string;
	product: import('./product').Product;
}

export interface Coupon {
	id: number;
	code: string;
	type: 'percent' | 'fixed';
	/** Строкой с двумя знаками: "10.00" */
	value: string;
	validFrom: string | null;
	validTo: string | null;
	isActive: boolean;
	maxUses: number | null;
	maxUsesPerUser: number | null;
	minSubtotal: string | null;
	/** Применений к активным заказам; отмена заказа уменьшает */
	usedCount: number;
	createAt: string;
	updateAt?: string;
}
