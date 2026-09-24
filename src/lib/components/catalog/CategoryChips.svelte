<script lang="ts" module>
	export interface Chip {
		label: string;
		href: string;
		active: boolean;
	}
</script>

<script lang="ts">
	interface Props {
		chips: Chip[];
	}

	let { chips }: Props = $props();
</script>

{#if chips.length > 1}
	<nav aria-label="Разделы" class="-mx-4 overflow-x-auto px-4 [scrollbar-width:none] md:-mx-6 md:px-6 lg:mx-0 lg:px-0">
		<ul class="flex gap-2 whitespace-nowrap lg:flex-wrap">
			{#each chips as chip (chip.href)}
				<li>
					<a
						href={chip.href}
						aria-current={chip.active ? 'page' : undefined}
						data-sveltekit-noscroll
						class="inline-flex h-11 items-center rounded-full px-4 text-sm font-medium transition-colors duration-150 {chip.active
							? 'bg-ink text-white'
							: 'bg-surface text-gray-800 hover:bg-gray-200'}"
					>
						{chip.label}
					</a>
				</li>
			{/each}
		</ul>
	</nav>
{/if}
