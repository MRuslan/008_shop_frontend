// Server-side загрузка данных для страницы товара (SSR для SEO)

import { error } from '@sveltejs/kit';
import { productsApi } from '$lib/api/products';
import { categoriesApi } from '$lib/api/categories';
import { reviewsApi } from '$lib/api/reviews';
import { locationsApi } from '$lib/api/locations';
import { throwHttpError } from '$lib/utils/errors';
import type { Category } from '$lib/types/product';

export async function load({ params }) {
	// 404 остаётся 404, недоступный бэкенд превращается в 503, а не в «500 Ошибка загрузки»
	const product = await productsApi
		.getProductBySlug(params.slug)
		.catch((err) => throwHttpError(err, { notFound: 'Товар не найден' }));

	if (!product.isActive) {
		error(404, 'Товар не найден');
	}

	// Категория, отзывы и точки самовывоза дополняют страницу: без них она всё равно открывается
	const [category, reviews, locations] = await Promise.all([
		product.categoryId
			? categoriesApi.getCategoryById(product.categoryId).catch(() => null)
			: Promise.resolve(null),
		reviewsApi.getReviewsByProduct(product.id).catch(() => null),
		locationsApi.getLocations({ isActive: true }).catch(() => null)
	]);

	const visibleReviews = reviews?.filter((review) => review.isVisible) ?? null;
	// Рейтинг считает бэкенд; по отзывам — только если он его не прислал
	const serverAverage = product.ratingAvg ? Number.parseFloat(product.ratingAvg) : null;
	const rating =
		serverAverage && product.ratingCount
			? { average: serverAverage, count: product.ratingCount }
			: visibleReviews?.length
				? {
						average: visibleReviews.reduce((sum, review) => sum + review.rating, 0) / visibleReviews.length,
						count: visibleReviews.length
					}
				: null;

	// Склад не выдаёт заказы покупателям: считаем только пункты выдачи и магазины.
	// withStock — в скольких из них товар есть сейчас; null, если бэкенд не отдал остатки по точкам
	const pickupLocations = locations?.filter((location) => location.type !== 'warehouse') ?? null;
	const stockByLocation = new Map((product.stocks ?? []).map((stock) => [stock.locationId, stock.quantity]));
	const pickup = pickupLocations
		? {
				total: pickupLocations.length,
				withStock: product.stocks
					? pickupLocations.filter((location) => (stockByLocation.get(location.id) ?? 0) > 0).length
					: null
			}
		: null;

	return { product, category: category as Category | null, reviews: visibleReviews, rating, pickup };
}
