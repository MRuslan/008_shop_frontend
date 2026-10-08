// Адреса, точки самовывоза и наличие корзины по точкам. При SSR запросы идут через свой /api
// с cookie посетителя, и форма приходит заполненной; корзину уже отдал корневой layout

import { addressesApi } from '$lib/api/addresses';
import { locationsApi } from '$lib/api/locations';
import { cartApi } from '$lib/api/cart';
import { getErrorMessage } from '$lib/utils/errors';
import type { PageLoad } from './$types';

export const load: PageLoad = async ({ fetch }) => {
	try {
		const [addresses, locations, availability] = await Promise.all([
			addressesApi.getAddresses({ fetch }),
			locationsApi.getLocations({ isActive: true }, { fetch }),
			// Старый бэкенд без наличия по точкам: остатки проверит оформление заказа
			cartApi.getAvailability({ fetch }).catch(() => null)
		]);
		return { checkout: { addresses, locations, availability }, loadError: null };
	} catch (error) {
		console.error('Failed to load checkout data:', error);
		return {
			checkout: null,
			loadError: getErrorMessage(error, 'Не удалось загрузить адреса и точки самовывоза.')
		};
	}
};
