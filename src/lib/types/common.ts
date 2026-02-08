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
	settings: Record<string, any>;
	createAt: string;
	updateAt: string;
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
	value: number;
	validFrom: string | null;
	validTo: string | null;
	isActive: boolean;
	createAt: string;
	updateAt: string;
}
