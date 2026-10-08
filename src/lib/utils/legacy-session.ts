// Прежняя версия витрины хранила вход и номер гостевой корзины в localStorage, где их мог прочитать
// любой скрипт на странице. Один раз отдаём их серверу витрины (он переложит их в httpOnly-cookie) и стираем

const LEGACY_KEYS = ['access_token', 'refresh_token', 'session_id'];

/** true — что-то перенесли, данные страницы нужно перечитать */
export async function migrateLegacySession(): Promise<boolean> {
	let refreshToken: string | null;
	let sessionId: string | null;
	try {
		refreshToken = localStorage.getItem('refresh_token');
		// Совсем старые корзины жили в sessionStorage вкладки
		sessionId = localStorage.getItem('session_id') ?? sessionStorage.getItem('session_id');
	} catch {
		// Хранилище недоступно (запрещено настройками браузера): переносить нечего
		return false;
	}
	if (!refreshToken && !sessionId) return false;

	try {
		const response = await fetch('/api/bff/legacy-session', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ refreshToken, sessionId })
		});
		// Сервер недоступен: попробуем при следующей загрузке
		if (!response.ok) return false;
	} catch {
		return false;
	}

	for (const key of LEGACY_KEYS) {
		localStorage.removeItem(key);
		sessionStorage.removeItem(key);
	}
	return true;
}
