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

export interface OrderStatusHistory {
	id: number;
	orderId: number;
	fromStatus: OrderStatus | null;
	toStatus: OrderStatus;
	/** Кто сменил статус: сам покупатель или сотрудник; null — система */
	changedByUserId: number | null;
	comment: string | null;
	createAt: string;
}

export interface Order {
	id: number;
	userId: number;
	status: OrderStatus;
	deliveryType: DeliveryType;
	pickupLocationId: number | null;
	pickupLocation?: Location | null;
	/** Точка, с которой списан товар */
	stockLocationId?: number | null;
	deliveryAddressId: number | null;
	deliveryAddressSnapshot?: AddressSnapshot | null;
	paymentMethod: string;
	/** Товары до скидки. `totalAmount = subtotalAmount - discountAmount + deliveryCost` */
	subtotalAmount?: string;
	deliveryCost?: string;
	totalAmount: string;
	couponCode: string | null;
	discountAmount: string | null;
	comment: string | null;
	items: OrderItem[];
	statusHistory?: OrderStatusHistory[];
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
	/** Попадает в историю статусов и в письмо покупателю */
	comment?: string;
}

/** Тело предрасчёта: как у оформления, адрес и точка необязательны */
export type OrderQuoteDto = Omit<CreateOrderDto, 'comment'>;

export type OrderQuoteProblemCode =
	| 'delivery_disabled'
	| 'pickup_disabled'
	| 'min_order_amount'
	| 'product_unavailable';

export interface OrderQuote {
	deliveryType: DeliveryType;
	items: Array<{
		productId: number;
		productName: string;
		price: string;
		quantity: number;
		lineTotal: string;
		isActive: boolean;
	}>;
	subtotalAmount: string;
	/** Всегда строка, "0.00" без скидки */
	discountAmount: string;
	deliveryCost: string;
	totalAmount: string;
	/** Сколько добавить до бесплатной доставки; null — порога нет, он достигнут или самовывоз */
	freeDeliveryRemaining: string | null;
	/** null, если промокод не передан. Неподходящий — не ошибка: applied false и причина в error */
	coupon: { code: string; applied: boolean; error: string | null } | null;
	problems: Array<{ code: OrderQuoteProblemCode | string; message: string }>;
	canOrder: boolean;
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
