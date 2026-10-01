// Условия доставки из настроек магазина одной строкой: «300 ₽, бесплатно от 5 000 ₽»

import type { StoreSettings } from '$lib/types/common';
import { formatPrice } from './format';

export function deliveryTerms(delivery: StoreSettings['delivery'] | null | undefined, currency = 'RUB'): string | null {
	if (!delivery) return null;
	const parts: string[] = [];
	if (parseFloat(delivery.price) === 0) {
		parts.push('бесплатно');
	} else {
		parts.push(formatPrice(delivery.price, currency));
		if (delivery.freeFrom) parts.push(`бесплатно от\u00a0${formatPrice(delivery.freeFrom, currency)}`);
	}
	if (delivery.minOrderAmount) parts.push(`заказ от\u00a0${formatPrice(delivery.minOrderAmount, currency)}`);
	const text = parts.join(', ');
	return text.charAt(0).toUpperCase() + text.slice(1);
}
