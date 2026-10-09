// Период дашборда: пресет или свои даты из адреса. Дни считаем в часовом поясе магазина,
// как и бэкенд, иначе «сегодня» у админа и у статистики разойдётся ночью

export type PeriodPreset = 'today' | '7d' | '30d' | '90d' | 'custom';

export interface StatsPeriod {
	preset: PeriodPreset;
	/** YYYY-MM-DD включительно */
	from: string;
	to: string;
}

export const PERIOD_PRESETS: { value: Exclude<PeriodPreset, 'custom'>; label: string; days: number }[] = [
	{ value: 'today', label: 'Сегодня', days: 1 },
	{ value: '7d', label: '7 дней', days: 7 },
	{ value: '30d', label: '30 дней', days: 30 },
	{ value: '90d', label: '90 дней', days: 90 }
];

const DEFAULT_PRESET: PeriodPreset = '30d';
const MAX_DAYS = 366;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

/** Сегодняшняя дата в указанном часовом поясе; при неизвестной зоне — локальная */
export function todayIn(timeZone: string | null | undefined): string {
	try {
		return new Intl.DateTimeFormat('en-CA', { timeZone: timeZone || undefined }).format(new Date());
	} catch {
		return new Intl.DateTimeFormat('en-CA').format(new Date());
	}
}

/** Сдвиг даты YYYY-MM-DD на N дней без оглядки на часовой пояс (UTC-полдень, чтобы не задеть переход суток) */
export function shiftDate(date: string, days: number): string {
	const at = new Date(`${date}T12:00:00Z`);
	at.setUTCDate(at.getUTCDate() + days);
	return at.toISOString().slice(0, 10);
}

/** Число дней между датами включительно */
export function daysBetween(from: string, to: string): number {
	const start = Date.parse(`${from}T12:00:00Z`);
	const end = Date.parse(`${to}T12:00:00Z`);
	return Math.round((end - start) / 86_400_000) + 1;
}

export function periodFromParams(params: URLSearchParams, timeZone: string | null | undefined): StatsPeriod {
	const today = todayIn(timeZone);
	const from = params.get('from');
	const to = params.get('to');

	// Свои даты: обе валидны, по порядку и не длиннее года; иначе пресет по умолчанию
	if (from && to && DATE_RE.test(from) && DATE_RE.test(to) && from <= to && daysBetween(from, to) <= MAX_DAYS) {
		return { preset: 'custom', from, to };
	}

	const requested = params.get('period');
	const preset = PERIOD_PRESETS.find((item) => item.value === requested) ?? PERIOD_PRESETS.find((item) => item.value === DEFAULT_PRESET)!;
	return { preset: preset.value, from: shiftDate(today, -(preset.days - 1)), to: today };
}

/** Адрес дашборда для пресета или своих дат */
export function periodHref(period: { preset: PeriodPreset; from?: string; to?: string }): string {
	if (period.preset === 'custom' && period.from && period.to) return `/admin?from=${period.from}&to=${period.to}`;
	return period.preset === DEFAULT_PRESET ? '/admin' : `/admin?period=${period.preset}`;
}
