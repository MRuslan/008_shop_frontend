<script lang="ts">
	// Включено / выключено в админке: слово и точка на нейтральной плашке, как статус заказа
	interface Props {
		active: boolean;
		on?: string;
		off?: string;
	}

	let { active, on = 'Активен', off = 'Неактивен' }: Props = $props();
</script>

<span
	class="inline-flex items-center gap-1.5 rounded-full bg-gray-100 px-2.5 py-1 text-label font-medium whitespace-nowrap {active
		? 'text-gray-800'
		: 'text-gray-600'}"
>
	<span class="size-1.5 shrink-0 rounded-full {active ? 'bg-positive' : 'bg-gray-400'}" aria-hidden="true"></span>
	{active ? on : off}
</span>
