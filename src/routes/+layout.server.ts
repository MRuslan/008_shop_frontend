// Server-side layout: загрузка настроек магазина

import { API_BASE_URL } from '$lib/utils/constants';
import type { Store } from '$lib/types/common';

export async function load() {
	try {
		const response = await fetch(`${API_BASE_URL}/store`, {
			headers: {
				'Content-Type': 'application/json'
			}
		});

		if (response.ok) {
			const store: Store = await response.json();
			return {
				store
			};
		}
		
		return {
			store: null
		};
	} catch (error) {
		console.error('Failed to load store settings:', error);
		return {
			store: null
		};
	}
}
