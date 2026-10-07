// Утилиты для SEO (JSON-LD).
// Абсолютные URL строятся от адреса сайта (siteOrigin: PUBLIC_SITE_URL, в разработке origin запроса),
// так сервер и клиент отдают одинаковую разметку, а краулер получает полные адреса.

import type { Product, Category } from '$lib/types/product';
import type { Store, Review } from '$lib/types/common';

/**
 * Готовый <script type="application/ld+json"> для {@html}. JSON.stringify не экранирует
 * «</script>»: товар или категория с такой строкой в названии закрыли бы тег и выполнили
 * свой скрипт у каждого посетителя. Поэтому <, >, & и разделители строк U+2028/U+2029
 * заменяем на \u-последовательности: для JSON-парсера это те же символы
 */
export function jsonLdScript(data: unknown): string {
	const json = JSON.stringify(data)
		.replace(/</g, '\\u003c')
		.replace(/>/g, '\\u003e')
		.replace(/&/g, '\\u0026')
		.replace(/\u2028/g, '\\u2028')
		.replace(/\u2029/g, '\\u2029');
	return `<script type="application/ld+json">${json}</script>`;
}

const DEFAULT_CURRENCY = 'RUB';

function absoluteUrl(origin: string, path: string): string {
	return `${origin.replace(/\/$/, '')}${path}`;
}

// Атрибуты, из которых берём бренд товара для разметки
const BRAND_ATTRIBUTES = ['бренд', 'производитель', 'марка', 'brand'];

/**
 * JSON-LD для товара. Рейтинг и отзывы добавляем, только когда они реально есть:
 * за выдуманные оценки поисковики снимают расширенный сниппет
 */
export function generateProductJsonLd(
	product: Product,
	store?: Store | null,
	origin = '',
	extras: {
		rating?: { average: number; count: number } | null;
		reviews?: Review[] | null;
	} = {}
): object {
	const images = product.images?.map((img) => img.url) || [];
	const currency = store?.currency || DEFAULT_CURRENCY;
	const brand = product.attributes?.find((attribute) =>
		BRAND_ATTRIBUTES.includes(attribute.name.trim().toLowerCase())
	)?.value;
	const reviews = (extras.reviews ?? []).filter((review) => review.isVisible).slice(0, 5);

	return {
		'@context': 'https://schema.org/',
		'@type': 'Product',
		name: product.name,
		description: product.description || product.name,
		image: images,
		sku: product.sku || undefined,
		brand: brand ? { '@type': 'Brand', name: brand } : undefined,
		category: product.category?.name || undefined,
		offers: {
			'@type': 'Offer',
			price: product.price,
			priceCurrency: currency,
			availability:
				product.quantity > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
			url: absoluteUrl(origin, `/products/${product.slug}`),
			itemCondition: 'https://schema.org/NewCondition'
		},
		aggregateRating:
			extras.rating && extras.rating.count > 0
				? {
						'@type': 'AggregateRating',
						ratingValue: Number(extras.rating.average.toFixed(1)),
						reviewCount: extras.rating.count,
						bestRating: 5,
						worstRating: 1
					}
				: undefined,
		review: reviews.length
			? reviews.map((review) => ({
					'@type': 'Review',
					reviewRating: { '@type': 'Rating', ratingValue: review.rating, bestRating: 5, worstRating: 1 },
					author: { '@type': 'Person', name: review.user?.username || 'Покупатель' },
					datePublished: review.createAt.split('T')[0],
					reviewBody: review.text || undefined
				}))
			: undefined
	};
}

/**
 * JSON-LD для организации (магазина)
 */
export function generateOrganizationJsonLd(store: Store, origin = ''): object {
	return {
		'@context': 'https://schema.org/',
		'@type': 'Organization',
		name: store.name,
		legalName: store.legalName || undefined,
		taxID: store.inn || undefined,
		url: origin ? `${origin}/` : undefined,
		logo: store.logoUrl || undefined,
		contactPoint: {
			'@type': 'ContactPoint',
			telephone: store.contactPhone || undefined,
			email: store.contactEmail || undefined,
			contactType: 'customer service'
		},
		address: store.legalAddress
			? {
					'@type': 'PostalAddress',
					addressCountry: 'RU',
					streetAddress: store.legalAddress
				}
			: undefined
	};
}

/**
 * JSON-LD для сайта: название в выдаче и строка поиска по сайту прямо в результатах
 */
export function generateWebSiteJsonLd(name: string, origin: string): object {
	return {
		'@context': 'https://schema.org/',
		'@type': 'WebSite',
		name,
		url: `${origin}/`,
		potentialAction: {
			'@type': 'SearchAction',
			target: { '@type': 'EntryPoint', urlTemplate: `${origin}/search?q={search_term_string}` },
			'query-input': 'required name=search_term_string'
		}
	};
}

/**
 * JSON-LD для BreadcrumbList
 */
export function generateBreadcrumbJsonLd(
	items: Array<{ name: string; url: string }>,
	origin = ''
): object {
	return {
		'@context': 'https://schema.org/',
		'@type': 'BreadcrumbList',
		itemListElement: items.map((item, index) => ({
			'@type': 'ListItem',
			position: index + 1,
			name: item.name,
			item: absoluteUrl(origin, item.url)
		}))
	};
}

/**
 * JSON-LD для коллекции товаров (каталог или категория). Только ссылки на товары:
 * полная разметка Product с ценами нужна на странице товара, в списках Google её не учитывает
 * и может счесть ошибкой
 */
export function generateCollectionJsonLd(
	products: Product[],
	category?: Category | null,
	origin = '',
	canonicalUrl?: string,
	/** Позиция первого товара на странице: на второй странице нумерация продолжается */
	offset = 0
): object {
	return {
		'@context': 'https://schema.org/',
		'@type': 'CollectionPage',
		name: category ? category.name : 'Каталог товаров',
		url: canonicalUrl ?? absoluteUrl(origin, category ? `/categories/${category.slug}` : '/catalog'),
		mainEntity: {
			'@type': 'ItemList',
			numberOfItems: products.length,
			itemListElement: products.map((product, index) => ({
				'@type': 'ListItem',
				position: offset + index + 1,
				url: absoluteUrl(origin, `/products/${product.slug}`),
				name: product.name
			}))
		}
	};
}

/**
 * Описание для meta description: без переносов, не длиннее ~160 символов, обрезка по слову
 */
export function metaDescription(text: string, max = 160): string {
	const flat = text.replace(/\s+/g, ' ').trim();
	if (flat.length <= max) return flat;
	const cut = flat.slice(0, max - 1);
	const lastSpace = cut.lastIndexOf(' ');
	return `${(lastSpace > max * 0.6 ? cut.slice(0, lastSpace) : cut).replace(/[\s,.;:–—-]+$/, '')}…`;
}
