<script lang="ts">
	import ChevronRight from '@lucide/svelte/icons/chevron-right';

	interface Crumb {
		name: string;
		href: string;
	}

	interface Props {
		items: Crumb[];
	}

	let { items }: Props = $props();
</script>

<!-- На телефоне от двух крошек осталась бы одна «Главная»: такой ряд не показываем -->
<nav
	aria-label="Вы здесь"
	class="-mx-1 overflow-x-auto [scrollbar-width:none] {items.length <= 2 ? 'hidden md:block' : ''}"
>
	<ol class="flex items-center gap-0.5 px-1 text-sm whitespace-nowrap text-gray-500">
		{#each items as item, index (item.href)}
			<li class="items-center gap-0.5 {index === items.length - 1 ? 'hidden md:flex' : 'flex'}">
				{#if index > 0}
					<ChevronRight class="size-3.5 shrink-0 text-gray-400" aria-hidden="true" />
				{/if}
				{#if index === items.length - 1}
					<span aria-current="page" class="max-w-[16rem] truncate text-gray-700">{item.name}</span>
				{:else}
					<a href={item.href} class="inline-flex min-h-8 items-center rounded-md px-0.5 hover:text-ink">{item.name}</a>
				{/if}
			</li>
		{/each}
	</ol>
</nav>
