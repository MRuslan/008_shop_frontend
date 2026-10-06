<script lang="ts">
	import { navigating } from '$app/state';

	// Полоса появляется, только если переход дольше 150 мс: на быстрых переходах она бы лишь мигала
	const SHOW_DELAY = 150;

	let visible = $state(false);
	let bar: HTMLDivElement | undefined = $state();

	$effect(() => {
		if (!navigating.to) return;
		const timer = setTimeout(() => (visible = true), SHOW_DELAY);
		return () => clearTimeout(timer);
	});

	// Пока страница грузится, полоса ползёт к 90 %, замедляясь: точного прогресса у загрузки нет
	$effect(() => {
		if (!bar) return;
		const grow = bar.animate([{ transform: 'scaleX(0)' }, { transform: 'scaleX(0.9)' }], {
			duration: 8000,
			easing: 'cubic-bezier(0.1, 0.7, 0.2, 1)',
			fill: 'forwards'
		});
		return () => grow.cancel();
	});

	// Переход закончился: полоса добегает до конца с того места, где была, и гаснет
	$effect(() => {
		if (navigating.to || !visible || !bar) return;
		const finish = bar.animate([{ transform: 'scaleX(1)', opacity: 0 }], {
			duration: 300,
			easing: 'ease-out',
			fill: 'forwards'
		});
		finish.finished.then(() => (visible = false)).catch(() => {});
		return () => finish.cancel();
	});
</script>

{#if visible}
	<!-- Свой слой для View Transitions: полоса не растворяется вместе со страницей -->
	<div
		class="pointer-events-none fixed inset-x-0 top-0 z-[60] h-0.5 [view-transition-name:nav-progress]"
		aria-hidden="true"
	>
		<div bind:this={bar} class="h-full origin-left scale-x-0 bg-ink"></div>
	</div>
{/if}
