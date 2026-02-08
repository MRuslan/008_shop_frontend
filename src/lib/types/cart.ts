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
