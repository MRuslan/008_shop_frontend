<script lang="ts">
	import { cartStore, cartItemsCount } from '$lib/stores/cart';

	interface Props {
		class?: string;
	}

	let { class: className = '' }: Props = $props();

	// Счётчик вздрагивает, когда товаров стало больше. Первая загрузка корзины не считается
	let bumpKey = $state(0);
	let previous: number | null = null;

	$effect(() => {
		const count = $cartItemsCount;
		const loaded = $cartStore !== null;
		if (!loaded) return;
		if (previous !== null && count > previous) bumpKey++;
		previous = count;
	});
</script>

{#if $cartItemsCount > 0}
	{#key bumpKey}
		<span
			class="pointer-events-none inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-ink px-1 text-[0.6875rem] leading-none font-semibold text-white tabular-nums ring-2 ring-surface {bumpKey
				? 'animate-bump'
				: ''} {className}"
			aria-hidden="true"
		>
			{$cartItemsCount > 99 ? '99+' : $cartItemsCount}
		</span>
	{/key}
{/if}
