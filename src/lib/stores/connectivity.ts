// Связь с магазином: у браузера нет сети или сервер магазина не отвечает. Баннер в layout
// показывает это и покупателю, и сотрудникам, вместо разрозненных ошибок на каждом действии

import { writable } from 'svelte/store';
import { browser } from '$app/environment';
import { toast } from './toast';

export type Connectivity = 'online' | 'offline' | 'unreachable';

/** Пока сервер не отвечает, проверяем его сами, не дожидаясь действий покупателя */
const RECHECK_MS = 10_000;

function createConnectivity() {
	const { subscribe, set } = writable<Connectivity>('online');
	let state: Connectivity = 'online';
	let timer: ReturnType<typeof setTimeout> | null = null;

	function change(next: Connectivity) {
		if (next === state) return;
		const recovered = state !== 'online' && next === 'online';
		state = next;
		set(next);
		if (timer) {
			clearTimeout(timer);
			timer = null;
		}
		if (next === 'unreachable') timer = setTimeout(check, RECHECK_MS);
		if (recovered) toast.success('Связь с магазином восстановлена');
	}

	async function check() {
		timer = null;
		try {
			// Настройки магазина — самый лёгкий запрос через свой сервер к бэкенду; 404 тоже ответ
			const response = await fetch('/api/store', { cache: 'no-store' });
			if (response.status < 500) {
				change('online');
				return;
			}
		} catch {
			// Сети всё ещё нет
		}
		if (state === 'unreachable') timer = setTimeout(check, RECHECK_MS);
	}

	if (browser) {
		if (!navigator.onLine) change('offline');
		window.addEventListener('offline', () => change('offline'));
		window.addEventListener('online', () => change('online'));
	}

	return {
		subscribe,
		/** Запрос не дошёл до бэкенда: сеть оборвалась или сервер ответил 502–504 */
		reportFailure() {
			if (state === 'online') change('unreachable');
		},
		/** Бэкенд ответил: если висел баннер, связь вернулась */
		reportSuccess() {
			if (state === 'unreachable') change('online');
		},
		/** «Повторить» в баннере: проверить сразу, не дожидаясь таймера */
		retry() {
			if (state === 'unreachable') void check();
		}
	};
}

export const connectivity = createConnectivity();
