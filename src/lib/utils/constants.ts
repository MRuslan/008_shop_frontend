// Константы приложения

import { env } from '$env/dynamic/public';

// Адрес API задаётся при запуске (PUBLIC_API_URL=https://api.example.com/api node build), а не при сборке.
// import.meta.env видит только VITE_*, поэтому раньше переменная молча игнорировалась
export const API_BASE_URL = env.PUBLIC_API_URL || 'http://localhost:3380/api';

export const TOKEN_STORAGE_KEY = 'access_token';
export const REFRESH_TOKEN_STORAGE_KEY = 'refresh_token';
export const SESSION_ID_KEY = 'session_id';

export const CART_ITEMS_LIMIT = 100; // Максимальное количество товаров в корзине
