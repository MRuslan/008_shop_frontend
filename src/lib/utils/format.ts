// Утилиты для форматирования

/**
 * Форматирует цену с валютой
 */
export function formatPrice(price: string | number, currency: string = 'RUB'): string {
	const numPrice = typeof price === 'string' ? parseFloat(price) : price;
	// Копейки либо целиком, либо никак: «1 234 567,50 ₽», а не «1 234 567,5 ₽»
	const fractionDigits = Number.isInteger(numPrice) ? 0 : 2;

	return new Intl.NumberFormat('ru-RU', {
		style: 'currency',
		currency: currency,
		minimumFractionDigits: fractionDigits,
		maximumFractionDigits: fractionDigits
	}).format(numPrice);
}

/**
 * Русская форма слова для числа: pluralize(5, ['товар', 'товара', 'товаров']) → 'товаров'
 */
export function pluralize(count: number, forms: [string, string, string]): string {
	const n = Math.abs(count) % 100;
	const n1 = n % 10;
	if (n > 10 && n < 20) return forms[2];
	if (n1 > 1 && n1 < 5) return forms[1];
	if (n1 === 1) return forms[0];
	return forms[2];
}

/**
 * Процент скидки от старой цены; 0, если старой цены нет или она не выше текущей
 */
export function discountPercent(price: string, compareAtPrice: string | null): number {
	if (!compareAtPrice) return 0;
	const now = parseFloat(price);
	const before = parseFloat(compareAtPrice);
	if (!(before > now) || !(before > 0)) return 0;
	return Math.round((1 - now / before) * 100);
}

/**
 * Форматирует дату
 */
export function formatDate(date: string | Date, locale: string = 'ru-RU'): string {
	const dateObj = typeof date === 'string' ? new Date(date) : date;
	
	return new Intl.DateTimeFormat(locale, {
		year: 'numeric',
		month: 'long',
		day: 'numeric'
	}).format(dateObj);
}

/**
 * Форматирует дату и время
 */
export function formatDateTime(date: string | Date, locale: string = 'ru-RU'): string {
	const dateObj = typeof date === 'string' ? new Date(date) : date;
	
	return new Intl.DateTimeFormat(locale, {
		year: 'numeric',
		month: 'long',
		day: 'numeric',
		hour: '2-digit',
		minute: '2-digit'
	}).format(dateObj);
}
