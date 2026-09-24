<script lang="ts">
	import { fly } from 'svelte/transition';
	import { toasts } from '$lib/stores/toast';
	import CircleCheck from '@lucide/svelte/icons/circle-check';
	import TriangleAlert from '@lucide/svelte/icons/triangle-alert';
	import Info from '@lucide/svelte/icons/info';
	import X from '@lucide/svelte/icons/x';

	const reduceMotion =
		typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
	const duration = reduceMotion ? 0 : 220;

	const icons = { success: CircleCheck, error: TriangleAlert, info: Info } as const;
</script>

<!-- Тёмная плашка, как снэкбар в мобильном приложении; на телефоне стоит над нижними вкладками -->
<div
	class="pointer-events-none fixed inset-x-3 bottom-[calc(var(--tabbar-height)+max(0.75rem,env(safe-area-inset-bottom)))] z-50 flex flex-col gap-2 md:inset-x-auto md:right-6 md:bottom-6 md:w-96"
>
	{#each $toasts as t (t.id)}
		{@const Icon = icons[t.type]}
		<div
			role={t.type === 'error' ? 'alert' : 'status'}
			transition:fly={{ y: 16, duration }}
			class="pointer-events-auto flex items-start gap-3 rounded-2xl bg-ink py-3 pr-2 pl-4 text-white shadow-[0_8px_24px_rgb(0_0_0/0.18)]"
		>
			<Icon class="mt-0.5 size-5 shrink-0 {t.type === 'error' ? 'text-red-300' : 'text-gray-300'}" aria-hidden="true" />

			<p class="min-w-0 flex-1 text-sm leading-5">
				{t.message}
				{#if t.action}
					<a
						href={t.action.href}
						onclick={() => toasts.dismiss(t.id)}
						class="ml-1 font-semibold whitespace-nowrap underline decoration-white/40 underline-offset-2 hover:decoration-white"
					>
						{t.action.label}
					</a>
				{/if}
			</p>

			<button
				type="button"
				onclick={() => toasts.dismiss(t.id)}
				class="-my-2 inline-flex size-11 shrink-0 items-center justify-center rounded-xl text-gray-400 transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-white"
				aria-label="Закрыть уведомление"
			>
				<X class="size-4" aria-hidden="true" />
			</button>
		</div>
	{/each}
</div>
