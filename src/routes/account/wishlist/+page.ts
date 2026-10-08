// Избранное. При SSR запрос идёт через свой /api с cookie посетителя

import { wishlistApi } from '$lib/api/wishlist';
import { getErrorMessage } from '$lib/utils/errors';
import type { WishlistItem } from '$lib/types/common';
import type { PageLoad } from './$types';

export const load: PageLoad = async ({ fetch }) => {
	try {
		return { items: await wishlistApi.getWishlist({ fetch }), error: null };
	} catch (error) {
		console.error('Failed to load wishlist:', error);
		return { items: [] as WishlistItem[], error: getErrorMessage(error, 'Ошибка загрузки избранного') };
	}
};
