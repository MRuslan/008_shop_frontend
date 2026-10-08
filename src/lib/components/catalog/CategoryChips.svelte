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
		/** Подпись навигации для скринридера */
		label?: string;
	}

	let { chips, label = 'Разделы' }: Props = $props();
</script>

{#if chips.length > 1}
	<nav aria-label={label} class="-mx-4 overflow-x-auto px-4 [scrollbar-width:none] md:-mx-6 md:px-6 lg:mx-0 lg:px-0">
		<ul class="flex gap-2 whitespace-nowrap lg:flex-wrap">
			{#each chips as chip (chip.href)}
				<li>
					<a
						href={chip.href}
						aria-current={chip.active ? 'page' : undefined}
						data-sveltekit-noscroll
						title={chip.label.length > 28 ? chip.label : undefined}
						class="inline-flex h-11 max-w-[16rem] items-center rounded-full px-4 text-control transition-colors duration-150 {chip.active
							? 'bg-ink text-white'
							: 'bg-surface text-gray-800 hover:bg-gray-200'}"
					>
						<!-- Длинное название раздела не растягивает чипс на всю ширину экрана -->
						<span class="truncate">{chip.label}</span>
					</a>
				</li>
			{/each}
		</ul>
	</nav>
{/if}
