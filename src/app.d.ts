// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
import type { Store } from '$lib/types/common';
import type { User } from '$lib/types/auth';
import type { Cart } from '$lib/types/cart';

declare global {
	namespace App {
		// interface Error {}
		interface Locals {
			/** Действующий access-токен посетителя из httpOnly-cookie; null — гость */
			accessToken: string | null;
			/**
			 * Входа больше нет: продлить его не удалось (cookie стёрты) или запрос требует входа, а cookie нет.
			 * Браузер узнает об этом из заголовка ответа
			 */
			sessionEnded: boolean;
			/** Пользователь из /auth/me: запрашивается один раз за запрос (см. currentUser) */
			user?: Promise<User | null>;
		}
		interface PageData {
			store?: Store | null;
			/** Вошедший пользователь; null — гость */
			user?: User | null;
			/** Корзина посетителя; null — не загрузилась */
			cart?: Cart | null;
		}
		// interface PageState {}
		// interface Platform {}
	}
}

export {};
