// Утилиты для SEO

import type { Product, Category } from '$lib/types/product';
import type { Store } from '$lib/types/common';

export interface MetaTags {
	title: string;
	description: string;
	image?: string;
	url?: string;
	type?: string;
}

/**
 * Генерирует полный набор мета-тегов для страницы
 */
export function generateMetaTags(meta: MetaTags, store?: Store): string {
	const siteName = store?.name || 'Интернет-магазин';
	const siteUrl = typeof window !== 'undefined' ? window.location.origin : '';
	const fullTitle = meta.title.includes(siteName) ? meta.title : `${meta.title} | ${siteName}`;
	const image = meta.image || store?.logoUrl || '';
	const url = meta.url || (typeof window !== 'undefined' ? window.location.href : '');

	return `
		<title>${fullTitle}</title>
		<meta name="description" content="${meta.description}" />
		<meta property="og:title" content="${fullTitle}" />
		<meta property="og:description" content="${meta.description}" />
		<meta property="og:type" content="${meta.type || 'website'}" />
		${url ? `<meta property="og:url" content="${url}" />` : ''}
		${image ? `<meta property="og:image" content="${image}" />` : ''}
		<meta property="og:site_name" content="${siteName}" />
		<meta name="twitter:card" content="summary_large_image" />
		<meta name="twitter:title" content="${fullTitle}" />
		<meta name="twitter:description" content="${meta.description}" />
		${image ? `<meta name="twitter:image" content="${image}" />` : ''}
		${url ? `<link rel="canonical" href="${url}" />` : ''}
	`.trim();
}

/**
 * Генерирует JSON-LD для товара
 */
export function generateProductJsonLd(product: Product, store?: Store): object {
	const images = product.images?.map(img => img.url) || [];
	const currency = store?.currency || 'RUB';
	const siteUrl = typeof window !== 'undefined' ? window.location.origin : '';

	return {
		'@context': 'https://schema.org/',
		'@type': 'Product',
		name: product.name,
		description: product.description || product.name,
		image: images.length > 0 ? images : [],
		sku: product.sku || undefined,
		offers: {
			'@type': 'Offer',
			price: product.price,
			priceCurrency: currency,
			availability: product.quantity > 0 
				? 'https://schema.org/InStock' 
				: 'https://schema.org/OutOfStock',
			url: `${siteUrl}/products/${product.slug}`,
			priceValidUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
		},
		...(product.category && {
			category: product.category.name
		})
	};
}

/**
 * Генерирует JSON-LD для организации (магазина)
 */
export function generateOrganizationJsonLd(store: Store): object {
	const siteUrl = typeof window !== 'undefined' ? window.location.origin : '';

	return {
		'@context': 'https://schema.org/',
		'@type': 'Organization',
		name: store.name,
		url: siteUrl,
		logo: store.logoUrl || undefined,
		contactPoint: {
			'@type': 'ContactPoint',
			telephone: store.contactPhone || undefined,
			email: store.contactEmail || undefined,
			contactType: 'customer service'
		},
		address: store.legalAddress ? {
			'@type': 'PostalAddress',
			addressCountry: 'RU',
			addressLocality: store.legalAddress
		} : undefined
	};
}

/**
 * Генерирует JSON-LD для BreadcrumbList
 */
export function generateBreadcrumbJsonLd(items: Array<{ name: string; url: string }>): object {
	const siteUrl = typeof window !== 'undefined' ? window.location.origin : '';

	return {
		'@context': 'https://schema.org/',
		'@type': 'BreadcrumbList',
		itemListElement: items.map((item, index) => ({
			'@type': 'ListItem',
			position: index + 1,
			name: item.name,
			item: `${siteUrl}${item.url}`
		}))
	};
}

/**
 * Генерирует JSON-LD для коллекции товаров (каталог)
 */
export function generateCollectionJsonLd(
	products: Product[],
	category?: Category,
	store?: Store
): object {
	const siteUrl = typeof window !== 'undefined' ? window.location.origin : '';
	const currency = store?.currency || 'RUB';

	return {
		'@context': 'https://schema.org/',
		'@type': 'CollectionPage',
		name: category ? category.name : 'Каталог товаров',
		description: category 
			? `Товары категории ${category.name}` 
			: 'Каталог товаров нашего магазина',
		url: `${siteUrl}${category ? `/categories/${category.slug}` : '/catalog'}`,
		mainEntity: {
			'@type': 'ItemList',
			numberOfItems: products.length,
			itemListElement: products.map((product, index) => ({
				'@type': 'ListItem',
				position: index + 1,
				item: {
					'@type': 'Product',
					name: product.name,
					image: product.images?.[0]?.url || undefined,
					offers: {
						'@type': 'Offer',
						price: product.price,
						priceCurrency: currency,
						availability: product.quantity > 0 
							? 'https://schema.org/InStock' 
							: 'https://schema.org/OutOfStock'
					}
				}
			}))
		}
	};
}
