// Контакты: точки продаж подгружаем на сервере, настройки магазина уже есть в данных корневого layout

import { locationsApi } from '$lib/api/locations';
import { getErrorMessage } from '$lib/utils/errors';
import type { Location } from '$lib/types/order';

export async function load() {
	try {
		const locations = await locationsApi.getLocations({ isActive: true });
		return { locations, locationsError: null as string | null };
	} catch (err) {
		console.error('Failed to load locations for contacts page:', err);
		return {
			locations: [] as Location[],
			locationsError: getErrorMessage(err, 'Не удалось загрузить список точек продаж.')
		};
	}
}
