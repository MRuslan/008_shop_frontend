<script lang="ts">
	import { invalidateAll } from '$app/navigation';
	import { navigating } from '$app/state';
	import { storeSettings } from '$lib/stores/store';
	import { formatPrice, formatDateTime, pluralize } from '$lib/utils/format';
	import { PERIOD_PRESETS, periodHref, todayIn } from '$lib/utils/stats-period';
	import { orderStatusLabel } from '$lib/utils/order-status';
	import type { DailyPoint } from '$lib/types/stats';
	import type { OrderStatus } from '$lib/types/order';
	import BarChart from '$lib/components/admin/BarChart.svelte';
	import ArrowUpRight from '@lucide/svelte/icons/arrow-up-right';
	import ArrowDownRight from '@lucide/svelte/icons/arrow-down-right';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	const currency = $derived($storeSettings?.currency ?? 'RUB');
	const money = (value: string | number) => formatPrice(value, currency);
	// В крупных числах копейки — шум: округляем до рубля
	const wholeMoney = (value: string | number) => formatPrice(Math.round(Number(value)), currency);

	const percent = new Intl.NumberFormat('ru-RU', { style: 'percent', maximumFractionDigits: 0 });
	const signedPercent = new Intl.NumberFormat('ru-RU', { style: 'percent', maximumFractionDigits: 0, signDisplay: 'exceptZero' });
	const compact = new Intl.NumberFormat('ru-RU', { notation: 'compact', maximumFractionDigits: 1 });
	const dayLong = new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'long', timeZone: 'UTC' });
	const dayLongYear = new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
	const MONTHS = ['янв', 'фев', 'мар', 'апр', 'мая', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек'];

	// Даты периода приходят строками YYYY-MM-DD: читаем их как полдень UTC, чтобы часовой пояс не сдвинул день
	const asDate = (ymd: string) => new Date(`${ymd}T12:00:00Z`);
	const shortDay = (ymd: string) => `${asDate(ymd).getUTCDate()} ${MONTHS[asDate(ymd).getUTCMonth()]}`;

	function rangeLabel(from: string, to: string): string {
		if (from === to) return dayLongYear.format(asDate(from));
		const sameYear = from.slice(0, 4) === to.slice(0, 4);
		return `${(sameYear ? dayLong : dayLongYear).format(asDate(from))} — ${dayLongYear.format(asDate(to))}`;
	}

	const today = $derived(todayIn($storeSettings?.timezone));
	const period = $derived(data.period);
	const stats = $derived(data.stats);
	const reloading = $derived(navigating.to?.url.pathname === '/admin');

	// Сдвиг к прошлому периоду той же длины. Без прошлых продаж сравнивать не с чем — честно молчим
	function delta(current: string | number, previous: string | number): { text: string; direction: 'up' | 'down' | 'flat' } | null {
		const now = Number(current);
		const before = Number(previous);
		if (before === 0) return null;
		const ratio = (now - before) / before;
		if (Math.abs(ratio) < 0.005) return { text: 'без изменений', direction: 'flat' };
		return { text: signedPercent.format(ratio), direction: ratio > 0 ? 'up' : 'down' };
	}

	type Metric = 'revenue' | 'orders';
	let metric: Metric = $state('revenue');

	const METRICS: { value: Metric; label: string; title: string }[] = [
		{ value: 'revenue', label: 'Выручка', title: 'Выручка по дням' },
		{ value: 'orders', label: 'Заказы', title: 'Заказы по дням' }
	];

	function pointDetail(day: DailyPoint): string {
		const orders = `${day.orders} ${pluralize(day.orders, ['заказ', 'заказа', 'заказов'])}`;
		const cancelled = day.cancelled > 0 ? `, отменено ${day.cancelled}` : '';
		return `${dayLong.format(asDate(day.date))}: ${money(day.revenue)}, ${orders}${cancelled}`;
	}

	const chartPoints = $derived(
		(stats?.daily ?? []).map((day) => ({
			key: day.date,
			label: shortDay(day.date),
			value: metric === 'revenue' ? Number(day.revenue) : day.orders,
			detail: pointDetail(day)
		}))
	);
	const chartFormat = $derived(metric === 'revenue' ? (value: number) => `${compact.format(value)} ₽` : (value: number) => String(value));

	const pickupMax = $derived(Math.max(1, ...(stats?.operations.byPickupLocation.map((item) => item.orders) ?? [0])));

	const BY_LABEL = { customer: 'покупатель', staff: 'сотрудник' } as const;
	const RECENT_CANCELLATIONS = 5;
</script>

<svelte:head>
	<title>Обзор — Админ-панель</title>
</svelte:head>

<div class="space-y-4">
	<div class="rounded-2xl bg-surface p-5 md:p-6">
		<div class="flex flex-wrap items-start justify-between gap-x-6 gap-y-3">
			<div>
				<h1 class="text-headline text-ink">Обзор</h1>
				<p class="mt-1 text-body-sm text-gray-600">
					{rangeLabel(period.from, period.to)}
					{#if stats}
						· сравнение с {rangeLabel(stats.previous.from, stats.previous.to)}
					{/if}
				</p>
			</div>

			<!-- Период задаёт всё ниже: пресеты ссылками, свои даты — обычной GET-формой в тот же адрес -->
			<div class="flex flex-wrap items-center gap-2">
				<nav aria-label="Период" class="flex gap-1 rounded-xl bg-gray-100 p-1">
					{#each PERIOD_PRESETS as preset (preset.value)}
						{@const active = period.preset === preset.value}
						<a
							href={periodHref({ preset: preset.value })}
							aria-current={active ? 'true' : undefined}
							data-sveltekit-noscroll
							class="inline-flex h-9 items-center rounded-lg px-3 text-control whitespace-nowrap transition-colors {active
								? 'bg-surface text-ink shadow-[0_1px_2px_rgb(0_0_0/0.08)]'
								: 'text-gray-600 hover:text-ink'}"
						>
							{preset.label}
						</a>
					{/each}
				</nav>
				<form method="GET" action="/admin" class="flex flex-wrap items-center gap-2" data-sveltekit-noscroll>
					<label class="sr-only" for="stats-from">С даты</label>
					<input id="stats-from" type="date" name="from" value={period.preset === 'custom' ? period.from : ''} max={today} required class="field h-9 py-0 text-body-sm" />
					<span class="text-body-sm text-gray-500" aria-hidden="true">—</span>
					<label class="sr-only" for="stats-to">По дату</label>
					<input id="stats-to" type="date" name="to" value={period.preset === 'custom' ? period.to : ''} max={today} required class="field h-9 py-0 text-body-sm" />
					<button type="submit" class="btn-secondary h-9 min-h-0 px-3">Показать</button>
				</form>
			</div>
		</div>
	</div>

	{#if data.failed || !stats}
		<div class="rounded-2xl bg-surface p-5 md:p-6">
			<div role="alert" class="notice-error">Не удалось загрузить статистику. Обновите страницу через минуту.</div>
			<button type="button" onclick={() => invalidateAll()} class="btn-secondary mt-4">Повторить</button>
		</div>
	{:else}
		<!-- Пока грузится другой период, старые цифры остаются на месте, только гаснут: без прыжков раскладки -->
		<div class="space-y-4 transition-opacity duration-200 {reloading ? 'opacity-50' : ''}" aria-busy={reloading}>
			<!-- Главные числа одной полосой: клетки разделены волосяными линиями через фон сетки.
			     Четыре колонки только с 2xl: рядом с боковым меню клетка уже, чем семизначная выручка кеглем figure.
			     До этого выручка и отмены занимают всю строку, а три клетки на две колонки оставили бы пустой угол -->
			<section aria-label="Итоги периода" class="grid grid-cols-2 gap-px overflow-hidden rounded-2xl bg-line 2xl:grid-cols-4">
				<div class="col-span-2 bg-surface p-5 md:p-6 2xl:col-span-1">
					<p class="text-body-sm text-gray-600">Выручка</p>
					<p class="mt-2 text-figure text-ink">{wholeMoney(stats.sales.revenue)}</p>
					{@render deltaLine(delta(stats.sales.revenue, stats.sales.previous.revenue))}
				</div>
				<div class="bg-surface p-5 md:p-6">
					<p class="text-body-sm text-gray-600">Заказы</p>
					<p class="mt-2 text-headline-lg text-ink">{stats.sales.orders}</p>
					{@render deltaLine(delta(stats.sales.orders, stats.sales.previous.orders))}
				</div>
				<div class="bg-surface p-5 md:p-6">
					<p class="text-body-sm text-gray-600">Средний чек</p>
					<p class="mt-2 text-headline-lg text-ink">{wholeMoney(stats.sales.averageOrder)}</p>
					{@render deltaLine(delta(stats.sales.averageOrder, stats.sales.previous.averageOrder))}
				</div>
				<div class="col-span-2 bg-surface p-5 md:p-6 2xl:col-span-1">
					<p class="text-body-sm text-gray-600">Отменено</p>
					<p class="mt-2 text-headline-lg {stats.cancellations.total > 0 ? 'text-ink' : 'text-gray-400'}">{stats.cancellations.total}</p>
					<p class="mt-2 text-body-sm text-gray-500">
						{stats.cancellations.total > 0 ? `${percent.format(stats.cancellations.rate)} заказов периода` : 'ни одного заказа'}
					</p>
				</div>
			</section>

			<section class="rounded-2xl bg-surface p-5 md:p-6" aria-labelledby="chart-title">
				<div class="mb-4 flex flex-wrap items-center justify-between gap-3">
					<h2 id="chart-title" class="text-title-sm text-ink">{METRICS.find((item) => item.value === metric)?.title}</h2>
					<div class="flex gap-1 rounded-xl bg-gray-100 p-1" role="group" aria-label="Показатель графика">
						{#each METRICS as item (item.value)}
							<button
								type="button"
								aria-pressed={metric === item.value}
								onclick={() => (metric = item.value)}
								class="inline-flex h-9 items-center rounded-lg px-3 text-control transition-colors {metric === item.value
									? 'bg-surface text-ink shadow-[0_1px_2px_rgb(0_0_0/0.08)]'
									: 'text-gray-600 hover:text-ink'}"
							>
								{item.label}
							</button>
						{/each}
					</div>
				</div>
				<BarChart points={chartPoints} formatValue={chartFormat} label={METRICS.find((item) => item.value === metric)?.title ?? ''} emptyText="За этот период заказов не было" />
				<p class="mt-4 text-body-sm text-gray-600">
					Доставка {stats.sales.deliveryOrders} · самовывоз {stats.sales.pickupOrders}
					{#if stats.sales.couponOrders > 0}
						· с промокодом {stats.sales.couponOrders}, скидок на {money(stats.sales.discountTotal)}
					{/if}
				</p>
			</section>

			<div class="grid gap-4 lg:grid-cols-2">
				<!-- Что требует действий сейчас, а не за период -->
				<section class="rounded-2xl bg-surface p-5 md:p-6" aria-labelledby="attention-title">
					<h2 id="attention-title" class="text-title-sm text-ink">Требует внимания</h2>
					<ul class="mt-3 divide-y divide-line">
						{@render attentionRow(stats.operations.pendingOverdue, `${pluralize(stats.operations.pendingOverdue, ['новый заказ ждёт', 'новых заказа ждут', 'новых заказов ждут'])} дольше суток`, '/admin/orders?status=pending', 'negative')}
						{@render attentionRow(stats.operations.pendingTotal, pluralize(stats.operations.pendingTotal, ['новый заказ не подтверждён', 'новых заказа не подтверждены', 'новых заказов не подтверждено']), '/admin/orders?status=pending', 'caution')}
						{@render attentionRow(stats.operations.confirmedTotal, `${pluralize(stats.operations.confirmedTotal, ['подтверждён, ждёт', 'подтверждены, ждут', 'подтверждено, ждут'])} отправки или выдачи`, '/admin/orders?status=confirmed', 'neutral')}
						{@render attentionRow(stats.products.outOfStock, pluralize(stats.products.outOfStock, ['товар закончился', 'товара закончились', 'товаров закончилось']), '/admin/products', 'negative')}
						{@render attentionRow(stats.products.lowStock, pluralize(stats.products.lowStock, ['товар на исходе', 'товара на исходе', 'товаров на исходе']), '/admin/products', 'caution')}
						{@render attentionRow(stats.failures.mailFailed, `${pluralize(stats.failures.mailFailed, ['письмо не отправилось', 'письма не отправились', 'писем не отправилось'])} за период`, null, 'negative')}
						{@render attentionRow(stats.carts.abandoned, `${pluralize(stats.carts.abandoned, ['брошенная корзина', 'брошенные корзины', 'брошенных корзин'])} на ${money(stats.carts.abandonedValue)}`, null, 'neutral')}
					</ul>
				</section>

				<section class="rounded-2xl bg-surface p-5 md:p-6" aria-labelledby="customers-title">
					<h2 id="customers-title" class="text-title-sm text-ink">Покупатели</h2>
					<dl class="mt-3 grid grid-cols-3 gap-x-4 text-body-sm">
						<div>
							<dt class="text-gray-600">Новых</dt>
							<dd class="mt-0.5 text-title-sm text-ink">{stats.customers.new}</dd>
						</div>
						<div>
							<dt class="text-gray-600">Покупали</dt>
							<dd class="mt-0.5 text-title-sm text-ink">{stats.customers.buyers}</dd>
						</div>
						<div>
							<dt class="text-gray-600">Повторно</dt>
							<dd class="mt-0.5 text-title-sm text-ink">
								{stats.customers.repeat}
								{#if stats.customers.buyers > 0}
									<span class="text-body-sm font-normal text-gray-500">({percent.format(stats.customers.repeatRate)})</span>
								{/if}
							</dd>
						</div>
					</dl>

					{#if stats.operations.byPickupLocation.length > 0}
						<h3 class="mt-5 text-label font-medium text-gray-500">Самовывоз по точкам</h3>
						<ul class="mt-2 space-y-2">
							{#each stats.operations.byPickupLocation as point (point.locationId ?? 'deleted')}
								<li class="text-body-sm">
									<div class="flex items-baseline justify-between gap-3">
										<span class="min-w-0 truncate {point.name ? 'text-ink' : 'text-gray-500'}">{point.name ?? 'Удалённая точка'}</span>
										<span class="shrink-0 text-gray-700 tabular-nums">{point.orders}</span>
									</div>
									<!-- Одна полоса на точку: длина и есть число, цвет один -->
									<div class="mt-1 h-1.5 rounded-full bg-gray-100" aria-hidden="true">
										<div class="h-full rounded-full bg-ink" style="width: {Math.max(2, (point.orders / pickupMax) * 100)}%"></div>
									</div>
								</li>
							{/each}
						</ul>
					{/if}
				</section>

				<!-- Два высоких блока в одном ряду, чтобы колонки не разъезжались по высоте -->
				<section class="rounded-2xl bg-surface p-5 md:p-6" aria-labelledby="cancellations-title">
					<h2 id="cancellations-title" class="text-title-sm text-ink">Отмены</h2>
					{#if stats.cancellations.total === 0}
						<p class="mt-3 text-body-sm text-gray-600">За период ни один заказ не отменяли.</p>
					{:else}
						<dl class="mt-3 grid grid-cols-2 gap-x-6 gap-y-3 text-body-sm">
							<div>
								<dt class="text-gray-600">Отменил покупатель</dt>
								<dd class="mt-0.5 text-title-sm text-ink">{stats.cancellations.byCustomer}</dd>
							</div>
							<div>
								<dt class="text-gray-600">Отменил сотрудник</dt>
								<dd class="mt-0.5 text-title-sm text-ink">{stats.cancellations.byStaff}</dd>
							</div>
							{#each Object.entries(stats.cancellations.fromStatus) as [status, count] (status)}
								{#if count}
									<div>
										<dt class="text-gray-600">Из статуса «{orderStatusLabel(status as OrderStatus)}»</dt>
										<dd class="mt-0.5 text-title-sm text-ink">{count}</dd>
									</div>
								{/if}
							{/each}
						</dl>
						{#if stats.cancellations.recent.length > 0}
							<h3 class="mt-5 text-label font-medium text-gray-500">Последние отмены</h3>
							<ul class="mt-2 divide-y divide-line">
								{#each stats.cancellations.recent.slice(0, RECENT_CANCELLATIONS) as item (item.orderId)}
									<li class="py-2.5 text-body-sm">
										<p class="text-ink">
											<span class="font-medium">№{item.orderId}</span>
											<span class="text-gray-600">· {BY_LABEL[item.by]}{#if item.fromStatus} · из «{orderStatusLabel(item.fromStatus)}»{/if}</span>
										</p>
										<p class="mt-0.5 text-gray-600">
											{#if item.comment}«{item.comment}» · {/if}<time datetime={item.cancelledAt}>{formatDateTime(item.cancelledAt)}</time>
										</p>
									</li>
								{/each}
							</ul>
						{/if}
					{/if}
				</section>

				<section class="rounded-2xl bg-surface p-5 md:p-6" aria-labelledby="top-title">
					<h2 id="top-title" class="text-title-sm text-ink">Топ товаров</h2>
					{#if stats.products.top.length === 0}
						<p class="mt-3 text-body-sm text-gray-600">За период ничего не продано.</p>
					{:else}
						<table class="mt-3 w-full text-body-sm">
							<thead>
								<tr class="text-label font-medium text-gray-500">
									<th scope="col" class="pb-2 text-left font-medium">Товар</th>
									<th scope="col" class="pb-2 text-right font-medium">Шт.</th>
									<th scope="col" class="pb-2 pl-4 text-right font-medium">Выручка</th>
								</tr>
							</thead>
							<tbody class="divide-y divide-line">
								{#each stats.products.top as product (product.productId)}
									<tr>
										<td class="py-2 pr-3">
											{#if product.slug}
												<a href="/products/{product.slug}" class="text-ink hover:underline">{product.name}</a>
											{:else}
												<span class="text-gray-600">{product.name}</span>
											{/if}
										</td>
										<td class="py-2 text-right text-gray-700 tabular-nums">{product.quantity}</td>
										<td class="py-2 pl-4 text-right text-ink tabular-nums">{money(product.revenue)}</td>
									</tr>
								{/each}
							</tbody>
						</table>
					{/if}
					<p class="mt-4 text-body-sm text-gray-600">
						{#if stats.products.activeTotal > 0}
							Без продаж за период: {stats.products.noSales} из {stats.products.activeTotal} активных.
						{:else}
							Активных товаров нет.
						{/if}
					</p>
				</section>

			</div>
		</div>
	{/if}
</div>

{#snippet deltaLine(change: { text: string; direction: 'up' | 'down' | 'flat' } | null)}
	<p class="mt-2 flex items-center gap-1 text-body-sm {change?.direction === 'up' ? 'text-positive' : change?.direction === 'down' ? 'text-negative' : 'text-gray-500'}">
		{#if change}
			{#if change.direction === 'up'}
				<ArrowUpRight class="size-4 shrink-0" aria-hidden="true" />
			{:else if change.direction === 'down'}
				<ArrowDownRight class="size-4 shrink-0" aria-hidden="true" />
			{/if}
			{change.text}<span class="sr-only"> к прошлому периоду</span>
		{:else}
			нет данных за прошлый период
		{/if}
	</p>
{/snippet}

{#snippet attentionRow(count: number, label: string, href: string | null, tone: 'negative' | 'caution' | 'neutral')}
	{@const active = count > 0}
	<li class="flex items-center gap-3 py-2.5 text-body-sm">
		<span
			class="size-2 shrink-0 rounded-full {active ? (tone === 'negative' ? 'bg-negative' : tone === 'caution' ? 'bg-caution' : 'bg-gray-400') : 'bg-gray-200'}"
			aria-hidden="true"
		></span>
		<span class="min-w-0 flex-1 {active ? 'text-ink' : 'text-gray-500'}">
			<span class="font-medium tabular-nums">{count}</span>
			{label}
		</span>
		{#if href && active}
			<a {href} class="shrink-0 text-control text-gray-700 hover:text-ink hover:underline">Открыть</a>
		{/if}
	</li>
{/snippet}
