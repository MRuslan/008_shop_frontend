// Все запросы браузера к API идут сюда, а сервер витрины пересылает их бэкенду (см. $lib/server/proxy)

import { proxy } from '$lib/server/proxy';
import type { RequestHandler } from './$types';

export const fallback: RequestHandler = (event) => proxy(event);
