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
/**
 * Средняя оценка с одним знаком: «4,5». Бэкенд отдаёт её строкой ("4.50") или null без отзывов
 */
export function formatRating(ratingAvg: string | null | undefined): string | null {
	if (ratingAvg === null || ratingAvg === undefined) return null;
	const value = Number.parseFloat(ratingAvg);
	if (!Number.isFinite(value) || value <= 0) return null;
	return value.toLocaleString('ru-RU', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
}

export function discountPercent(price: string, compareAtPrice: string | null): number {
	if (!compareAtPrice) return 0;
	const now = parseFloat(price);
	const before = parseFloat(compareAtPrice);
	if (!(before > now) || !(before > 0)) return 0;
	return Math.round((1 - now / before) * 100);
}

/**
 * Часовой пояс магазина для всех дат на сайте. Без него сервер (обычно в UTC) и браузер
 * покупателя показали бы разное время, и текст менялся бы после загрузки страницы.
 * Задаёт корневой layout из настроек магазина
 */
let displayTimeZone = 'Europe/Moscow';

export function setDisplayTimeZone(timeZone: string | null | undefined) {
	if (!timeZone) return;
	try {
		new Intl.DateTimeFormat('ru-RU', { timeZone });
		displayTimeZone = timeZone;
	} catch {
		// Неизвестный пояс в настройках: остаёмся на прежнем, а не роняем страницу
	}
}

/**
 * Форматирует дату
 */
export function formatDate(date: string | Date, locale: string = 'ru-RU'): string {
	const dateObj = typeof date === 'string' ? new Date(date) : date;

	return new Intl.DateTimeFormat(locale, {
		year: 'numeric',
		month: 'long',
		day: 'numeric',
		timeZone: displayTimeZone
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
		minute: '2-digit',
		timeZone: displayTimeZone
	}).format(dateObj);
}
