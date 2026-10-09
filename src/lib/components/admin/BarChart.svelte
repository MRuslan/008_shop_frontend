<script lang="ts">
	interface ChartPoint {
		/** Уникален в пределах графика (например, дата) */
		key: string;
		/** Подпись оси X */
		label: string;
		value: number;
		/** Текст подсказки целиком: его же читает скринридер */
		detail: string;
	}

	interface Props {
		/** Точки по порядку: key уникален (дата), label — подпись оси X, detail — текст подсказки целиком */
		points: ChartPoint[];
		/** Формат подписей оси Y и значений в подсказке */
		formatValue: (value: number) => string;
		/** Доступное имя графика, например «Выручка по дням» */
		label: string;
		/** Текст, когда все значения нулевые */
		emptyText?: string;
	}

	let { points, formatValue, label, emptyText = 'Нет данных за период' }: Props = $props();

	// Геометрия считается в реальных пикселях контейнера (viewBox равен его ширине), поэтому
	// SVG не масштабируется и подписи не искажаются; до первого замера стоит ширина по умолчанию
	const DEFAULT_WIDTH = 640;
	const NARROW_WIDTH = 480;
	const PAD_TOP = 10;
	const PAD_RIGHT = 4;
	const AXIS_BAND = 26;
	const TICK_GAP = 8;
	const MAX_BAR_WIDTH = 24;
	const SURFACE_GAP = 2;
	const BAR_RADIUS = 4;
	const ZERO_MARK_HEIGHT = 2;
	const TIP_GAP = 8;
	// Средняя ширина знака подписи 12px: хватает, чтобы не резать подписи, не меряя текст в DOM
	const CHAR_WIDTH = 7.2;
	const MAX_GRID_INTERVALS = 4;

	let width = $state(0);
	let hoverIndex = $state<number | null>(null);
	let focusIndex = $state<number | null>(null);
	// Единственная точка входа Tab: дальше по столбцам ходят стрелки, а не тридцать табов
	let tabStop = $state(0);
	let tipWidth = $state(0);
	let tipHeight = $state(0);
	const items: (SVGGElement | undefined)[] = [];

	const chartWidth = $derived(width || DEFAULT_WIDTH);
	const narrow = $derived(chartWidth < NARROW_WIDTH);
	const chartHeight = $derived(narrow ? 200 : 220);

	// Отрицательных значений в дашборде нет; нечисловые считаем нулём, чтобы шкала не ломалась
	const values = $derived(points.map((point) => (Number.isFinite(point.value) && point.value > 0 ? point.value : 0)));
	const maxValue = $derived(Math.max(0, ...values));
	const isEmpty = $derived(maxValue <= 0);

	/**
	 * «Красивая» шкала: самый мелкий шаг из 1, 2, 2.5, 5 × 10^n, при котором интервалов не больше четырёх.
	 * Для целых данных (заказы, штуки) шаг не бывает дробным, иначе на оси появились бы «0,5 заказа»
	 */
	function niceScale(max: number, integersOnly: boolean): { step: number; top: number } {
		const startExp = Math.floor(Math.log10(max / MAX_GRID_INTERVALS)) - 1;
		for (let exp = startExp; exp <= startExp + 4; exp++) {
			for (const multiplier of [1, 2, 2.5, 5]) {
				const step = multiplier * 10 ** exp;
				if (integersOnly && !Number.isInteger(step)) continue;
				const intervals = Math.ceil(max / step - 1e-9);
				if (intervals <= MAX_GRID_INTERVALS) return { step, top: intervals * step };
			}
		}
		return { step: max, top: max };
	}

	const scale = $derived.by(() => {
		if (isEmpty) return { top: 1, ticks: [] as number[] };
		const { step, top } = niceScale(
			maxValue,
			points.every((point) => Number.isInteger(point.value))
		);
		const count = Math.round(top / step);
		// toPrecision убирает шум плавающей точки: 3 × 0.1 → 0.3, а не 0.30000000000000004
		const ticks = Array.from({ length: count + 1 }, (_, i) => Number((i * step).toPrecision(12)));
		return { top, ticks };
	});

	const tickLabels = $derived(scale.ticks.map((tick) => formatValue(tick)));

	// Левое поле по самой длинной подписи оси Y: подписи прижаты вправо к сетке
	const plotLeft = $derived(Math.max(0, ...tickLabels.map((text) => text.length)) * CHAR_WIDTH + TICK_GAP + 4);
	const plotTop = PAD_TOP;
	const plotWidth = $derived(Math.max(1, chartWidth - plotLeft - PAD_RIGHT));
	const plotHeight = $derived(chartHeight - PAD_TOP - AXIS_BAND);
	const baselineY = $derived(plotTop + plotHeight);

	const slot = $derived(plotWidth / Math.max(1, points.length));
	// Столбец тонкий (до 24px), а остаток слота остаётся воздухом; между соседними всегда зазор 2px
	const barWidth = $derived(Math.max(2, Math.min(MAX_BAR_WIDTH, slot - SURFACE_GAP)));

	function yOf(value: number): number {
		return plotTop + plotHeight * (1 - value / scale.top);
	}

	// Нулевой день не пропадает: у него штрих высотой 2px, как и у любого очень малого значения
	function barTop(value: number): number {
		return Math.min(yOf(value), baselineY - ZERO_MARK_HEIGHT);
	}

	function centerOf(index: number): number {
		return plotLeft + slot * index + slot / 2;
	}

	/** Столбец со скруглённой верхушкой (4px) и прямым основанием на базовой линии */
	function barPath(index: number, value: number): string {
		const left = centerOf(index) - barWidth / 2;
		const right = left + barWidth;
		const top = barTop(value);
		const radius = Math.min(BAR_RADIUS, barWidth / 2, baselineY - top);
		return `M${left},${baselineY}V${top + radius}Q${left},${top} ${left + radius},${top}H${right - radius}Q${right},${top} ${right},${top + radius}V${baselineY}Z`;
	}

	// Подписи оси X: не больше 7 (4 на узком экране), первая и последняя обязательны, остальные равномерно.
	// Если подписи всё равно упираются друг в друга (длинные даты), число уменьшается, пока не влезут
	const labelIndexes = $derived.by(() => {
		const count = points.length;
		if (count === 0) return [] as number[];
		const labelWidth = Math.max(...points.map((point) => point.label.length)) * CHAR_WIDTH + 12;
		let wanted = Math.min(count, narrow ? 4 : 7);
		const pick = (n: number): number[] => {
			if (n <= 1) return [0];
			return [...new Set(Array.from({ length: n }, (_, i) => Math.round((i * (count - 1)) / (n - 1))))];
		};
		let indexes = pick(wanted);
		while (wanted > 2 && indexes.length > 1 && centerOf(indexes[1]) - centerOf(indexes[0]) < labelWidth) {
			wanted -= 1;
			indexes = pick(wanted);
		}
		return indexes;
	});

	// Крайние подписи не должны вылезать за SVG: центр сдвигается внутрь на половину ширины текста
	function labelX(index: number): number {
		const half = (points[index].label.length * CHAR_WIDTH) / 2;
		return Math.min(Math.max(centerOf(index), half), chartWidth - half);
	}

	const activeIndex = $derived(hoverIndex ?? focusIndex);
	const activePoint = $derived(activeIndex === null ? null : (points[activeIndex] ?? null));
	const currentTabStop = $derived(Math.min(tabStop, Math.max(0, points.length - 1)));

	// Подсказка над столбцом, но целиком внутри области графика: по горизонтали прижимается к краям,
	// по вертикали не уходит выше верха (у самого высокого столбца ложится на его верхушку)
	const tipLeft = $derived(
		activeIndex === null
			? 0
			: Math.min(Math.max(centerOf(activeIndex) - tipWidth / 2, 0), Math.max(0, chartWidth - tipWidth))
	);
	const tipTop = $derived(
		activeIndex === null ? 0 : Math.max(0, barTop(values[activeIndex]) - tipHeight - TIP_GAP)
	);

	function onKeydown(event: KeyboardEvent, index: number) {
		const last = points.length - 1;
		let next: number;
		if (event.key === 'ArrowRight') next = Math.min(index + 1, last);
		else if (event.key === 'ArrowLeft') next = Math.max(index - 1, 0);
		else if (event.key === 'Home') next = 0;
		else if (event.key === 'End') next = last;
		else return;
		event.preventDefault();
		items[next]?.focus();
	}
</script>

<div class="relative" bind:clientWidth={width}>
	{#if isEmpty}
		<div class="flex items-center justify-center text-center" style:height="{chartHeight}px">
			<p class="text-body-sm text-gray-500">{emptyText}</p>
		</div>
	{:else}
		<svg
			viewBox="0 0 {chartWidth} {chartHeight}"
			width="100%"
			height={chartHeight}
			class="block max-w-full overflow-visible"
		>
			<!-- Сетка и подписи осей декоративны: те же числа есть в списке столбцов и в таблице ниже -->
			<g aria-hidden="true">
				{#each scale.ticks as tick, i (tick)}
					{@const y = Math.round(yOf(tick)) + 0.5}
					<line x1={plotLeft} x2={chartWidth - PAD_RIGHT} y1={y} y2={y} class="stroke-line" stroke-width="1" />
					<text
						x={plotLeft - TICK_GAP}
						{y}
						dy="0.32em"
						text-anchor="end"
						class="fill-gray-500 text-label tabular-nums"
					>
						{tickLabels[i]}
					</text>
				{/each}
				{#each labelIndexes as index (points[index].key)}
					<text x={labelX(index)} y={baselineY + 18} text-anchor="middle" class="fill-gray-500 text-label">
						{points[index].label}
					</text>
				{/each}
			</g>

			<!--
				Скринридер читает столбцы как список: у каждого элемента aria-label — готовый detail
				(«12 окт: 4 заказа, 15 990 ₽»), так что ничего не зависит от цвета и подсказки.
				<title> здесь хуже: его озвучивают не все читалки, а клавиатурный фокус он не показывает.
				Таблица ниже дублирует данные для тех, кто идёт по странице построчно
			-->
			<g role="list" aria-label={label}>
				{#each points as point, i (point.key)}
					{@const active = activeIndex === i}
					<!--
						Фокус клавиатуры и наведение выглядят одинаково; Tab приходит на один столбец, дальше стрелки.
						Правила a11y Svelte здесь ложно срабатывают: столбец осознанно фокусируем, чтобы подсказка
						была доступна без мыши, а роль listitem остаётся для скринридера
					-->
					<!-- svelte-ignore a11y_no_noninteractive_tabindex, a11y_no_noninteractive_element_interactions -->
					<g
						bind:this={items[i]}
						role="listitem"
						tabindex={i === currentTabStop ? 0 : -1}
						aria-label={point.detail}
						class="group outline-none"
						onpointerenter={() => (hoverIndex = i)}
						onpointerleave={() => (hoverIndex = null)}
						onfocus={() => {
							focusIndex = i;
							tabStop = i;
						}}
						onblur={() => {
							if (focusIndex === i) focusIndex = null;
						}}
						onkeydown={(event) => onKeydown(event, i)}
					>
						<!-- Цель наведения — весь слот по высоте графика, а не только закрашенный пиксель столбца -->
						<rect
							x={plotLeft + slot * i}
							y={plotTop}
							width={slot}
							height={plotHeight}
							class="transition-colors motion-reduce:transition-none {active ? 'fill-gray-50' : 'fill-transparent'}"
						/>
						<path
							d={barPath(i, values[i])}
							class="transition-colors motion-reduce:transition-none {values[i] === 0
								? 'fill-gray-400'
								: active
									? 'fill-gray-700'
									: 'fill-ink'}"
						/>
						<rect
							x={plotLeft + slot * i + 1}
							y={plotTop}
							width={Math.max(0, slot - 2)}
							height={plotHeight}
							rx="4"
							stroke-width="2"
							class="fill-none stroke-transparent group-focus-visible:stroke-ink"
						/>
					</g>
				{/each}
			</g>
		</svg>

		{#if activePoint}
			<!-- Визуальная копия detail: для скринридера она скрыта, он читает aria-label столбца -->
			<div
				aria-hidden="true"
				bind:clientWidth={tipWidth}
				bind:clientHeight={tipHeight}
				class="pointer-events-none absolute w-max max-w-[min(16rem,100%)] rounded-lg bg-ink px-3 py-2 text-body-sm text-white shadow-[0_8px_24px_rgb(0_0_0/0.18)] ring-2 ring-white"
				style:left="{tipLeft}px"
				style:top="{tipTop}px"
			>
				{activePoint.detail}
			</div>
		{/if}

		<table class="sr-only">
			<caption>{label}</caption>
			<thead>
				<tr>
					<th scope="col">Период</th>
					<th scope="col">Значение</th>
				</tr>
			</thead>
			<tbody>
				{#each points as point (point.key)}
					<tr>
						<th scope="row">{point.label}</th>
						<td>{formatValue(point.value)}</td>
					</tr>
				{/each}
			</tbody>
		</table>
	{/if}
</div>
