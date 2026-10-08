// Константы приложения

import { env } from '$env/dynamic/public';

// Адрес API задаётся при запуске (PUBLIC_API_URL=https://api.example.com/api node build), а не при сборке.
// import.meta.env видит только VITE_*, поэтому раньше переменная молча игнорировалась.
// Ходит по нему только сервер SvelteKit: браузер обращается к своему /api
export const API_BASE_URL = env.PUBLIC_API_URL || 'http://localhost:3380/api';

/** Запрос к /api без входа посетителя: сервер витрины не подставит токен и гостевую корзину */
export const ANONYMOUS_HEADER = 'x-anonymous';

/** Ответ /api: сервер витрины не смог продлить вход и стёр cookie сессии */
export const SESSION_ENDED_HEADER = 'x-session-ended';

/** Зависимость load списков заказов: перечитываются, когда приходит уведомление о заказе */
export const ORDERS_DEPENDENCY = 'app:orders';

export const CART_ITEMS_LIMIT = 100; // Максимальное количество товаров в корзине
