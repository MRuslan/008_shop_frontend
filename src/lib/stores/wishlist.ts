// Store избранного: множество id товаров текущего пользователя.
// Загружается один раз после входа, чтобы сердечко на каждой карточке не ходило в API само.

import { writable, get } from 'svelte/store';
import { browser } from '$app/environment';
import { wishlistApi } from '$lib/api/wishlist';
import { authStore } from './auth';
import { toast } from './toast';
import { getErrorMessage } from '$lib/utils/errors';

/** Список избранного пришёл с сервера для текущего пользователя */
export const wishlistReady = writable(false);

function createWishlistStore() {
	const ids = writable<Set<number>>(new Set());
	let loadedForUserId: number | null = null;

	if (browser) {
		authStore.subscribe(async ($auth) => {
			if ($auth.isLoading) return;
			if (!$auth.isAuthenticated || !$auth.user) {
				loadedForUserId = null;
				ids.set(new Set());
				wishlistReady.set(false);
				return;
			}
			if (loadedForUserId === $auth.user.id) return;
			loadedForUserId = $auth.user.id;
			try {
				const items = await wishlistApi.getWishlist();
				ids.set(new Set(items.map((item) => item.productId)));
				wishlistReady.set(true);
			} catch {
				// Избранное не критично для витрины: сердечки просто останутся пустыми
			}
		});
	}

	function setHas(productId: number, value: boolean) {
		ids.update((current) => {
			const next = new Set(current);
			if (value) next.add(productId);
			else next.delete(productId);
			return next;
		});
	}

	return {
		subscribe: ids.subscribe,

		/**
		 * Переключить товар в избранном. Гостю предлагаем войти.
		 * Состояние меняется сразу и откатывается, если сервер ответил ошибкой.
		 */
		async toggle(productId: number) {
			if (!get(authStore).isAuthenticated) {
				window.dispatchEvent(new CustomEvent('open-auth-modal'));
				return;
			}

			const wasInWishlist = get(ids).has(productId);
			setHas(productId, !wasInWishlist);

			try {
				if (wasInWishlist) {
					await wishlistApi.removeFromWishlist(productId);
					toast.info('Товар убран из избранного');
				} else {
					await wishlistApi.addToWishlist(productId);
					toast.success('Товар в избранном', {
						action: { label: 'Открыть избранное', href: '/account/wishlist' }
					});
				}
			} catch (err) {
				setHas(productId, wasInWishlist);
				toast.error(getErrorMessage(err, 'Не удалось обновить избранное'));
			}
		}
	};
}

export const wishlistStore = createWishlistStore();
