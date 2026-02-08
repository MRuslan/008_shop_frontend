// Store для настроек магазина

import { writable } from 'svelte/store';
import type { Store } from '$lib/types/common';

export const storeSettings = writable<Store | null>(null);
