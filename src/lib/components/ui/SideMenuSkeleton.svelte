<script lang="ts">
	import Skeleton from './Skeleton.svelte';

	// Кабинет и админка, пока проверяется вход: та же сетка, что у layout — чипсы на телефоне,
	// боковое меню 16rem и панель содержимого на десктопе
	interface Props {
		/** Сколько пунктов в меню */
		items?: number;
	}

	let { items = 4 }: Props = $props();
</script>

<div class="container py-4 md:py-6" role="status">
	<span class="sr-only">Загрузка…</span>
	<div class="mb-3 flex gap-2 overflow-hidden lg:hidden">
		{#each Array.from({ length: Math.min(items, 4) }, (_, i) => i) as index (index)}
			<Skeleton class="h-11 w-28 shrink-0 rounded-full" />
		{/each}
	</div>
	<div class="lg:grid lg:grid-cols-[16rem_minmax(0,1fr)] lg:items-start lg:gap-6">
		<div class="hidden rounded-2xl bg-surface p-5 lg:block">
			<Skeleton class="mb-4 h-7 w-2/3" />
			<div class="space-y-1">
				{#each Array.from({ length: items }, (_, i) => i) as index (index)}
					<Skeleton class="h-11 rounded-xl" />
				{/each}
			</div>
		</div>
		<div class="rounded-2xl bg-surface p-5 md:p-6">
			<Skeleton class="mb-6 h-8 w-1/3" />
			<div class="space-y-2">
				<Skeleton class="h-20 rounded-xl" />
				<Skeleton class="h-20 rounded-xl" />
				<Skeleton class="h-20 rounded-xl" />
			</div>
		</div>
	</div>
</div>
