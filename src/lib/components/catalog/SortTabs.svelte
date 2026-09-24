<script lang="ts" module>
	export type SortValue = 'createAt-DESC' | 'price-ASC' | 'price-DESC' | 'name-ASC';
</script>

<script lang="ts">
	interface Props {
		value: string;
		href: (value: SortValue) => string;
	}

	let { value, href }: Props = $props();

	const options: { value: SortValue; label: string }[] = [
		{ value: 'createAt-DESC', label: 'Новинки' },
		{ value: 'price-ASC', label: 'Сначала дешёвые' },
		{ value: 'price-DESC', label: 'Сначала дорогие' },
		{ value: 'name-ASC', label: 'По названию' }
	];
</script>

<!-- На узком экране строка прокручивается; край гаснет, намекая, что вариантов больше -->
<nav
	aria-label="Сортировка"
	class="-mx-1 min-w-0 overflow-x-auto [mask-image:linear-gradient(to_right,#000_calc(100%-1.5rem),transparent)] [scrollbar-width:none] md:[mask-image:none]"
>
	<ul class="flex gap-1 px-1 whitespace-nowrap">
		{#each options as option (option.value)}
			{@const active = option.value === value}
			<li>
				<a
					href={href(option.value)}
					aria-current={active ? 'true' : undefined}
					data-sveltekit-noscroll
					class="inline-flex h-11 items-center rounded-xl px-3 text-sm transition-colors {active
						? 'bg-surface font-semibold text-ink'
						: 'text-gray-600 hover:text-ink'}"
				>
					{option.label}
				</a>
			</li>
		{/each}
	</ul>
</nav>
