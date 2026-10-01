// Типы для корзины

import type { Product } from './product';

export interface CartItem {
	id: number;
	cartId: number;
	productId: number;
	quantity: number;
	product: Product;
}

export interface Cart {
	id: number;
	userId: number | null;
	sessionId: string | null;
	createAt: string;
	updateAt: string;
	items: CartItem[];
}

export interface AddCartItemDto {
	productId: number;
	quantity: number;
}

export interface UpdateCartItemDto {
	quantity: number;
}

export interface MergeSessionDto {
	sessionId: string;
}

export interface CartShortage {
	productId: number;
	productName: string;
	requested: number;
	available: number;
	/** insufficient — на точке не хватает; unavailable — товар снят с продажи */
	reason: 'insufficient' | 'unavailable';
}

/** Где корзину можно забрать целиком и хватит ли её на доставку. Остатки не резервируются */
export interface CartAvailability {
	items: Array<{
		cartItemId: number;
		productId: number;
		productName: string;
		quantity: number;
		isActive: boolean;
		totalAvailable: number;
	}>;
	pickup: {
		enabled: boolean;
		points: Array<{
			locationId: number;
			name: string;
			type: 'warehouse' | 'pickup_point' | 'retail';
			city: string;
			street: string;
			building: string;
			available: boolean;
			shortages: CartShortage[];
		}>;
	};
	delivery: {
		enabled: boolean;
		locationId: number | null;
		available: boolean;
		shortages: CartShortage[];
	};
}
