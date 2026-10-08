// Адреса доставки. При SSR запрос идёт через свой /api с cookie посетителя

import { addressesApi } from '$lib/api/addresses';
import { getErrorMessage } from '$lib/utils/errors';
import type { Address } from '$lib/types/common';
import type { PageLoad } from './$types';

export const load: PageLoad = async ({ fetch }) => {
	try {
		return { addresses: await addressesApi.getAddresses({ fetch }), error: null };
	} catch (error) {
		console.error('Failed to load addresses:', error);
		return { addresses: [] as Address[], error: getErrorMessage(error, 'Не удалось загрузить адреса.') };
	}
};
