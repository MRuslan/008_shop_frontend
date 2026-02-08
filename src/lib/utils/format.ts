// Утилиты для форматирования

/**
 * Форматирует цену с валютой
 */
export function formatPrice(price: string | number, currency: string = 'RUB'): string {
	const numPrice = typeof price === 'string' ? parseFloat(price) : price;
	
	return new Intl.NumberFormat('ru-RU', {
		style: 'currency',
		currency: currency,
		minimumFractionDigits: 0,
		maximumFractionDigits: 2
	}).format(numPrice);
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
