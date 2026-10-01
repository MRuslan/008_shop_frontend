// Тексты о нехватке товара: одна формулировка для доставки и точек самовывоза

import type { CartShortage } from '$lib/types/cart';

export function shortageText(shortage: CartShortage, place: 'pickup' | 'delivery' = 'pickup'): string {
	if (shortage.reason === 'unavailable') return `«${shortage.productName}» снят с продажи`;
	if (shortage.available <= 0) {
		return place === 'delivery' ? `«${shortage.productName}» нет на складе` : `«${shortage.productName}» здесь нет`;
	}
	return `«${shortage.productName}»: есть ${shortage.available}\u00a0из\u00a0${shortage.requested}\u00a0шт.`;
}

/**
 * Бэкенд называет промокод купоном. На витрине везде «промокод»; окончания у слов совпадают,
 * поэтому достаточно заменить основу с учётом заглавной буквы
 */
export function couponToPromo(text: string): string {
	return text.replace(/([Кк])упон/g, (_, first: string) => (first === 'К' ? 'Промокод' : 'промокод'));
}
