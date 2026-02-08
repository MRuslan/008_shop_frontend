// Server-side загрузка корзины

import { cartApi } from '$lib/api/cart';
import { authApi } from '$lib/api/auth';
import { getOrCreateSessionId } from '$lib/utils/session';
import { browser } from '$app/environment';

export async function load({ cookies }) {
	// На сервере корзина не загружается, так как нужен токен или sessionId
	// Загрузка происходит на клиенте
	return {
		// Пустые данные, корзина загрузится на клиенте
	};
}
