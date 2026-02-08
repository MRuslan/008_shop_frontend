// Типы для заказов

export type OrderStatus = 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';
export type DeliveryType = 'delivery' | 'pickup';

export interface OrderItem {
	id: number;
	productId: number;
	productName: string;
	price: string;
	quantity: number;
	product?: {
		id: number;
		name: string;
		slug: string;
	};
}

export interface Order {
	id: number;
	userId: number;
	status: OrderStatus;
	deliveryType: DeliveryType;
	pickupLocationId: number | null;
	pickupLocation?: Location | null;
	deliveryAddressId: number | null;
	deliveryAddressSnapshot?: AddressSnapshot | null;
	paymentMethod: string;
	totalAmount: string;
	couponCode: string | null;
	discountAmount: string | null;
	comment: string | null;
	items: OrderItem[];
	createAt: string;
	updateAt: string;
}

export interface CreateOrderDto {
	deliveryType: DeliveryType;
	deliveryAddressId?: number;
	pickupLocationId?: number;
	couponCode?: string;
	comment?: string;
}

export interface UpdateOrderStatusDto {
	status: OrderStatus;
}

export interface AddressSnapshot {
	label: string;
	city: string;
	street: string;
	building: string;
	apartment?: string;
	postalCode?: string;
	phone: string;
}

export interface Location {
	id: number;
	storeId: number;
	name: string;
	type: 'warehouse' | 'pickup_point' | 'retail';
	city: string;
	street: string;
	building: string;
	apartment?: string;
	postalCode?: string;
	phone: string;
	openingHours?: Array<{
		day: number;
		from: string;
		to: string;
	}>;
	sortOrder: number;
	isActive: boolean;
	createAt: string;
	updateAt: string;
}
