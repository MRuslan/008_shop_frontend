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
	const rating = visibleReviews?.length
		? {
				average: visibleReviews.reduce((sum, review) => sum + review.rating, 0) / visibleReviews.length,
				count: visibleReviews.length
			}
		: null;

	// Склад не выдаёт заказы покупателям: считаем только пункты выдачи и магазины
	const pickupPoints = locations?.filter((location) => location.type !== 'warehouse').length ?? null;

	return { product, category: category as Category | null, rating, pickupPoints };
}
