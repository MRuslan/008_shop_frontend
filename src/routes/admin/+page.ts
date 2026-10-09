// Главная админки — дашборд: статистика за период из адреса (?period=7d|30d|today|custom&from&to)

import { statsApi } from '$lib/api/stats';
import { periodFromParams } from '$lib/utils/stats-period';
import type { PageLoad } from './$types';

export const load: PageLoad = async ({ url, fetch, parent }) => {
	const { store } = await parent();
	const period = periodFromParams(url.searchParams, store?.timezone);
	try {
		const stats = await statsApi.getAdminStats({ from: period.from, to: period.to }, { fetch });
		return { period, stats, failed: false as const };
	} catch (error) {
		console.error('Failed to load stats:', error);
		return { period, stats: null, failed: true as const };
	}
};
