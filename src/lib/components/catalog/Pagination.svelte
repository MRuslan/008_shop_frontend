<script lang="ts">
	import ChevronLeft from '@lucide/svelte/icons/chevron-left';
	import ChevronRight from '@lucide/svelte/icons/chevron-right';

	interface Props {
		current: number;
		total: number;
		/** Ссылка на страницу: пагинация работает и без JavaScript, и для поисковиков */
		href: (page: number) => string;
		label: string;
	}

	let { current, total, href, label }: Props = $props();

	// Окно из соседних страниц плюс первая и последняя; разрывы помечаем многоточием
	const items = $derived.by(() => {
		const pages: (number | 'gap')[] = [];
		for (let n = 1; n <= total; n++) {
			if (n === 1 || n === total || Math.abs(n - current) <= 1) {
				pages.push(n);
			} else if (pages[pages.length - 1] !== 'gap') {
				pages.push('gap');
			}
		}
		return pages;
	});

	const base =
		'inline-flex h-11 min-w-11 items-center justify-center rounded-xl px-3 text-sm font-medium tabular-nums transition-colors';
</script>

{#if total > 1}
	<nav aria-label={label} class="mt-8 flex flex-wrap items-center justify-center gap-1.5">
		{#if current > 1}
			<a href={href(current - 1)} class="{base} bg-surface text-gray-800 hover:bg-gray-50" rel="prev">
				<ChevronLeft class="size-4" aria-hidden="true" />
				<span class="sr-only sm:not-sr-only sm:ml-1">Назад</span>
			</a>
		{/if}

		{#each items as item, index (item === 'gap' ? `gap-${index}` : item)}
			{#if item === 'gap'}
				<span class="px-1 text-gray-400" aria-hidden="true">…</span>
			{:else if item === current}
				<span aria-current="page" class="{base} bg-ink text-white">{item}</span>
			{:else}
				<a href={href(item)} class="{base} bg-surface text-gray-800 hover:bg-gray-50" aria-label="Страница {item}">{item}</a>
			{/if}
		{/each}

		{#if current < total}
			<a href={href(current + 1)} class="{base} bg-surface text-gray-800 hover:bg-gray-50" rel="next">
				<span class="sr-only sm:not-sr-only sm:mr-1">Вперёд</span>
				<ChevronRight class="size-4" aria-hidden="true" />
			</a>
		{/if}
	</nav>
{/if}
