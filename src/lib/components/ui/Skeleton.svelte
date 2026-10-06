<script lang="ts">
	// Заглушка той же формы, что и будущее содержимое: когда данные придут, вёрстка не прыгнет
	interface Props {
		class?: string;
	}

	let { class: className = '' }: Props = $props();
</script>

<div class="rounded-md bg-gray-200/70 motion-safe:animate-pulse {className}" aria-hidden="true"></div>
