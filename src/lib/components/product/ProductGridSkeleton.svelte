<script lang="ts">
	import Skeleton from '$lib/components/ui/Skeleton.svelte';

	// Сетка карточек-заглушек: та же сетка и те же размеры, что у ProductList и ProductCard
	interface Props {
		count?: number;
		columns?: 3 | 4;
	}

	let { count = 4, columns = 3 }: Props = $props();
</script>

<ul
	class="grid grid-cols-[repeat(auto-fit,minmax(max(8.5rem,calc((100%_-_0.75rem)/2)),1fr))] gap-2 sm:gap-3 md:grid-cols-3 {columns === 4 ? 'xl:grid-cols-4' : ''}"
	aria-hidden="true"
>
	{#each Array.from({ length: count }, (_, i) => i) as index (index)}
		<li class="flex flex-col rounded-2xl bg-surface p-2.5 sm:p-3">
			<Skeleton class="aspect-square rounded-xl" />
			<Skeleton class="mt-2.5 h-5 w-16" />
			<Skeleton class="mt-1 h-6 w-24" />
			<Skeleton class="mt-1.5 h-4" />
			<Skeleton class="mt-1 h-4 w-2/3" />
			<Skeleton class="mt-3 h-11 rounded-xl" />
		</li>
	{/each}
</ul>
