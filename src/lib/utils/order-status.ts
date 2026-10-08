// Статусы заказа: подписи, цвета, допустимые переходы. Один источник для кабинета и админки

import type { DeliveryType, OrderStatus } from '$lib/types/order';

const LABELS: Record<OrderStatus, string> = {
	pending: 'Ожидает подтверждения',
	confirmed: 'Подтверждён',
	shipped: 'Передан в доставку',
	delivered: 'Доставлен',
	cancelled: 'Отменён'
};

// У самовывоза те же статусы звучат иначе, так же пишет бэкенд в письмах покупателю
const PICKUP_LABELS: Partial<Record<OrderStatus, string>> = {
	shipped: 'Готов к выдаче',
	delivered: 'Получен'
};

export const ORDER_STATUSES: OrderStatus[] = ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'];

export function orderStatusLabel(status: OrderStatus, deliveryType?: DeliveryType): string {
	if (deliveryType === 'pickup' && PICKUP_LABELS[status]) return PICKUP_LABELS[status];
	return LABELS[status] ?? status;
}

/** Подпись для фильтра по статусу, где заказы с доставкой и самовывозом вперемешку */
export function orderStatusFilterLabel(status: OrderStatus): string {
	const pickup = PICKUP_LABELS[status];
	return pickup ? `${LABELS[status]} / ${pickup.toLowerCase()}` : LABELS[status];
}

/**
 * Цвет точки статуса. Статус всегда читается словом, точка лишь подсказывает (Word-First Status):
 * ждёт действия магазина — caution, в работе — графит, получен — positive, отменён — negative
 */
export const ORDER_STATUS_DOT: Record<OrderStatus, string> = {
	pending: 'bg-caution',
	confirmed: 'bg-gray-500',
	shipped: 'bg-ink',
	delivered: 'bg-positive',
	cancelled: 'bg-negative'
};

/** Переходы, которые принимает бэкенд; остальные он отклонит с 400 */
export const ORDER_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
	pending: ['confirmed', 'cancelled'],
	confirmed: ['shipped', 'cancelled'],
	shipped: ['delivered'],
	delivered: [],
	cancelled: []
};

/** Покупатель может отменить сам, пока заказ не передан в доставку */
export function canCustomerCancel(status: OrderStatus): boolean {
	return status === 'pending' || status === 'confirmed';
}

/** Что будет дальше: одна строка под статусом, без обещаний, которых система не даёт */
export function orderNextStep(status: OrderStatus, deliveryType: DeliveryType): string {
	const pickup = deliveryType === 'pickup';
	switch (status) {
		case 'pending':
			return 'Заказ ждёт подтверждения магазином. Оплатить его нужно будет при получении.';
		case 'confirmed':
			return pickup
				? 'Магазин подтвердил заказ и собирает его. Пришлём письмо, когда его можно будет забрать.'
				: 'Магазин подтвердил заказ и готовит его к отправке. Оплата при получении.';
		case 'shipped':
			return pickup
				? 'Заказ ждёт вас в точке самовывоза. Оплата при получении.'
				: 'Заказ передан в доставку. Оплата при получении.';
		case 'delivered':
			return pickup ? 'Заказ получен. Спасибо за покупку!' : 'Заказ доставлен. Спасибо за покупку!';
		case 'cancelled':
			return 'Заказ отменён.';
	}
}
