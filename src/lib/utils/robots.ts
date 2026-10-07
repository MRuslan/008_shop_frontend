// Разделы, которые не должны попадать в поиск: личные, служебные и результаты поиска по сайту.
// Используются и в robots.txt, и в заголовке X-Robots-Tag (у кабинета и админки нет серверного <head>)
export const NOINDEX_PREFIXES = [
	'/account',
	'/admin',
	'/cart',
	'/checkout',
	'/reset-password',
	'/search',
	'/orders'
];

export function isNoindexPath(pathname: string): boolean {
	return NOINDEX_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}
