// Константы приложения

export const API_BASE_URL = import.meta.env.PUBLIC_API_URL || 'http://localhost:3000/api';

export const TOKEN_STORAGE_KEY = 'access_token';
export const REFRESH_TOKEN_STORAGE_KEY = 'refresh_token';
export const SESSION_ID_KEY = 'session_id';

export const CART_ITEMS_LIMIT = 100; // Максимальное количество товаров в корзине
