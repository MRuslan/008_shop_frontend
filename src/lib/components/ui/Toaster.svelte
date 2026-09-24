<script lang="ts">
	import { fly } from 'svelte/transition';
	import { toasts } from '$lib/stores/toast';

	const reduceMotion =
		typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
	const duration = reduceMotion ? 0 : 220;

	const styles = {
		success: { box: 'border-green-200', icon: 'text-green-600' },
		error: { box: 'border-red-200', icon: 'text-red-600' },
		info: { box: 'border-blue-200', icon: 'text-blue-600' }
	} as const;
</script>

<div
	class="pointer-events-none fixed inset-x-4 bottom-[max(1rem,env(safe-area-inset-bottom))] z-50 flex flex-col gap-2 sm:inset-x-auto sm:right-6 sm:bottom-6 sm:w-96"
>
	{#each $toasts as t (t.id)}
		<div
			role={t.type === 'error' ? 'alert' : 'status'}
			transition:fly={{ y: 16, duration }}
			class="pointer-events-auto flex items-start gap-3 rounded-lg border bg-white px-4 py-3 shadow-lg {styles[t.type].box}"
		>
			<svg
				class="mt-0.5 h-5 w-5 shrink-0 {styles[t.type].icon}"
				fill="none"
				stroke="currentColor"
				stroke-width="2"
				viewBox="0 0 24 24"
				aria-hidden="true"
			>
				{#if t.type === 'success'}
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
					/>
				{:else if t.type === 'error'}
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
					/>
				{:else}
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z"
					/>
				{/if}
			</svg>

			<p class="min-w-0 flex-1 text-sm text-gray-900">
				{t.message}
				{#if t.action}
					<a
						href={t.action.href}
						onclick={() => toasts.dismiss(t.id)}
						class="ml-1 font-medium text-blue-600 underline underline-offset-2 hover:text-blue-800"
					>
						{t.action.label}
					</a>
				{/if}
			</p>

			<button
				type="button"
				onclick={() => toasts.dismiss(t.id)}
				class="-my-2.5 -mr-2 inline-flex h-11 w-11 shrink-0 items-center justify-center rounded text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none"
				aria-label="Закрыть уведомление"
			>
				<svg
					class="h-4 w-4"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
					viewBox="0 0 24 24"
					aria-hidden="true"
				>
					<path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
				</svg>
			</button>
		</div>
	{/each}
</div>
