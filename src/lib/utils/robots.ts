// Разделы, которые не должны попадать в поиск: личные, служебные и результаты поиска по сайту.
// Используются и в robots.txt, и в заголовке X-Robots-Tag (его видят и ответы /api, у которых нет <head>)
export const NOINDEX_PREFIXES = [
	'/account',
	'/admin',
	'/cart',
	'/checkout',
	'/reset-password',
	'/confirm-email',
	'/search',
	'/orders',
	'/api'
];

export function isNoindexPath(pathname: string): boolean {
	return NOINDEX_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}
