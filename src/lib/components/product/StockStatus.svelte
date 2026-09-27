<script lang="ts">
	interface Props {
		quantity: number;
		class?: string;
	}

	let { quantity, class: className = '' }: Props = $props();

	// Остаток показываем как есть: цвет точки дублирует слово, а не заменяет его
	const LOW_STOCK = 3;
	const status = $derived(quantity <= 0 ? 'out' : quantity <= LOW_STOCK ? 'low' : 'in');
	const label = $derived(
		status === 'out' ? 'Нет в наличии' : status === 'low' ? `Осталось ${quantity}\u00a0шт.` : `В наличии ${quantity}\u00a0шт.`
	);
</script>

<p class="flex items-center gap-1.5 text-gray-600 {className}">
	<span
		class="size-1.5 shrink-0 rounded-full {status === 'out'
			? 'bg-gray-400'
			: status === 'low'
				? 'bg-caution'
				: 'bg-positive'}"
		aria-hidden="true"
	></span>
	<span class={status === 'low' ? 'text-caution' : ''}>{label}</span>
</p>
