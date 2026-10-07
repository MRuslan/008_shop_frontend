// Поисковики и старые браузеры запрашивают /favicon.ico без <link rel="icon">: отдаём SVG-иконку

import { redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = () => {
	redirect(301, '/favicon.svg');
};
