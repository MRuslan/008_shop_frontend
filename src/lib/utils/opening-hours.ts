// График работы точки продаж

export interface OpeningHours {
	day: number;
	from: string;
	to: string;
}

const DAY_NAMES = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];

/**
 * Бэкенд допускает две нумерации дней: 1–7 (Пн–Вс) и 0–6 (Вс–Сб, как в JS Date).
 * Определяем по наличию нуля и всегда показываем неделю с понедельника.
 */
export function formatOpeningHours(hours: OpeningHours[] | null | undefined): string[] {
	if (!hours?.length) return [];

	const zeroBased = hours.some((h) => h.day === 0);

	return hours
		.map((h) => {
			const index = zeroBased ? (h.day + 6) % 7 : h.day - 1;
			return { index, label: `${DAY_NAMES[index] ?? `День ${h.day}`}: ${h.from}–${h.to}` };
		})
		.sort((a, b) => a.index - b.index)
		.map((h) => h.label);
}
