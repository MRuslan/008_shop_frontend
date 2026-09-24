// Утилиты для SEO (JSON-LD).
// Абсолютные URL строятся от origin, который страницы берут из page.url: так сервер и клиент
// отдают одинаковую разметку, а краулер получает полные адреса.

import type { Product, Category } from '$lib/types/product';
import type { Store } from '$lib/types/common';

const DEFAULT_CURRENCY = 'RUB';

function absoluteUrl(origin: string, path: string): string {
	return `${origin.replace(/\/$/, '')}${path}`;
}

/**
 * JSON-LD для товара
 */
export function generateProductJsonLd(
	product: Product,
	store?: Store | null,
	origin = ''
): object {
	const images = product.images?.map((img) => img.url) || [];
	const currency = store?.currency || DEFAULT_CURRENCY;

	return {
		'@context': 'https://schema.org/',
		'@type': 'Product',
		name: product.name,
		description: product.description || product.name,
		image: images,
		sku: product.sku || undefined,
		offers: {
			'@type': 'Offer',
			price: product.price,
			priceCurrency: currency,
			availability:
				product.quantity > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
			url: absoluteUrl(origin, `/products/${product.slug}`),
			priceValidUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
				.toISOString()
				.split('T')[0]
		},
		...(product.category && {
			category: product.category.name
		})
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
		url: origin || undefined,
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
					addressLocality: store.legalAddress
				}
			: undefined
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
 * JSON-LD для коллекции товаров (каталог или категория)
 */
export function generateCollectionJsonLd(
	products: Product[],
	category?: Category | null,
	store?: Store | null,
	origin = ''
): object {
	const currency = store?.currency || DEFAULT_CURRENCY;

	return {
		'@context': 'https://schema.org/',
		'@type': 'CollectionPage',
		name: category ? category.name : 'Каталог товаров',
		description: category
			? `Товары категории ${category.name}`
			: 'Каталог товаров нашего магазина',
		url: absoluteUrl(origin, category ? `/categories/${category.slug}` : '/catalog'),
		mainEntity: {
			'@type': 'ItemList',
			numberOfItems: products.length,
			itemListElement: products.map((product, index) => ({
				'@type': 'ListItem',
				position: index + 1,
				item: {
					'@type': 'Product',
					name: product.name,
					url: absoluteUrl(origin, `/products/${product.slug}`),
					image: product.images?.[0]?.url || undefined,
					offers: {
						'@type': 'Offer',
						price: product.price,
						priceCurrency: currency,
						availability:
							product.quantity > 0
								? 'https://schema.org/InStock'
								: 'https://schema.org/OutOfStock'
					}
				}
			}))
		}
	};
}
