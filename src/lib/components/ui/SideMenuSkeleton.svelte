<script lang="ts">
	import Skeleton from './Skeleton.svelte';

	// Кабинет и админка, пока проверяется вход: боковое меню и карточка содержимого на своих местах
	interface Props {
		/** Сколько пунктов в меню */
		items?: number;
	}

	let { items = 4 }: Props = $props();
</script>

<div class="container mx-auto px-4 py-8" role="status">
	<span class="sr-only">Загрузка…</span>
	<div class="grid grid-cols-1 gap-6 lg:grid-cols-4">
		<div class="rounded-lg bg-white p-4 shadow-md lg:col-span-1">
			<Skeleton class="mb-4 h-7 w-2/3" />
			<div class="space-y-2">
				{#each Array.from({ length: items }, (_, i) => i) as index (index)}
					<Skeleton class="h-11" />
				{/each}
			</div>
		</div>
		<div class="rounded-lg bg-white p-6 shadow-md lg:col-span-3">
			<Skeleton class="mb-6 h-8 w-1/3" />
			<div class="space-y-4">
				<Skeleton class="h-20" />
				<Skeleton class="h-20" />
				<Skeleton class="h-20" />
			</div>
		</div>
	</div>
</div>
