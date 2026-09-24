<script lang="ts">
	import { tick } from 'svelte';
	import LoginForm from './LoginForm.svelte';
	import RegisterForm from './RegisterForm.svelte';

	type Mode = 'login' | 'register';

	interface Props {
		mode?: Mode;
		open?: boolean;
	}

	let { mode = $bindable('login'), open = $bindable(false) }: Props = $props();

	// Нативный <dialog>: ловушка фокуса, Escape, верхний слой и возврат фокуса на кнопку-триггер бесплатно
	let dialog: HTMLDialogElement | undefined = $state();

	const tabs: Array<{ id: Mode; label: string }> = [
		{ id: 'login', label: 'Вход' },
		{ id: 'register', label: 'Регистрация' }
	];

	async function focusFirstField() {
		await tick();
		dialog?.querySelector<HTMLInputElement>('input')?.focus();
	}

	$effect(() => {
		if (!dialog) return;
		if (open) {
			if (!dialog.open) {
				dialog.showModal();
				focusFirstField();
			}
		} else if (dialog.open) {
			dialog.close();
		}
	});

	$effect(() => {
		const handleSuccess = () => {
			open = false;
		};
		window.addEventListener('auth:success', handleSuccess);
		return () => window.removeEventListener('auth:success', handleSuccess);
	});

	function close() {
		open = false;
	}

	function handleBackdropClick(event: MouseEvent) {
		if (event.target === dialog) close();
	}

	// Escape закрывает окно и там, где браузер не шлёт нативный cancel (например, во встроенных webview)
	function handleDialogKeydown(event: KeyboardEvent) {
		if (event.key === 'Escape') {
			event.preventDefault();
			close();
		}
	}

	function switchMode(next: Mode) {
		mode = next;
		focusFirstField();
	}

	// Стрелки переключают вкладки, как положено tablist
	function handleTabKeydown(event: KeyboardEvent) {
		if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
		event.preventDefault();
		const next: Mode = mode === 'login' ? 'register' : 'login';
		mode = next;
		dialog?.querySelector<HTMLButtonElement>(`#auth-tab-${next}`)?.focus();
	}
</script>

<dialog
	bind:this={dialog}
	onclose={close}
	onclick={handleBackdropClick}
	onkeydown={handleDialogKeydown}
	aria-label={mode === 'login' ? 'Вход в аккаунт' : 'Регистрация'}
	class="m-auto w-[calc(100%-2rem)] max-w-md rounded-lg bg-white p-0 text-gray-900 shadow-xl backdrop:bg-black/50"
>
	{#if open}
		<div class="p-6">
			<div class="mb-6 flex items-center justify-between gap-4">
				<div
					role="tablist"
					aria-label="Вход или регистрация"
					class="flex gap-4"
					onkeydown={handleTabKeydown}
				>
					{#each tabs as tab (tab.id)}
						<button
							type="button"
							role="tab"
							id="auth-tab-{tab.id}"
							aria-selected={mode === tab.id}
							aria-controls="auth-panel"
							tabindex={mode === tab.id ? 0 : -1}
							onclick={() => switchMode(tab.id)}
							class="rounded-t border-b-2 px-4 py-2 font-medium transition-colors focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none {mode ===
							tab.id
								? 'border-blue-600 text-blue-600'
								: 'border-transparent text-gray-500 hover:text-gray-700'}"
						>
							{tab.label}
						</button>
					{/each}
				</div>
				<button
					type="button"
					onclick={close}
					class="rounded p-1 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none"
					aria-label="Закрыть"
				>
					<svg
						class="w-6 h-6"
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
						aria-hidden="true"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M6 18L18 6M6 6l12 12"
						/>
					</svg>
				</button>
			</div>

			<div id="auth-panel" role="tabpanel" aria-labelledby="auth-tab-{mode}">
				{#if mode === 'login'}
					<LoginForm />
				{:else}
					<RegisterForm />
				{/if}
			</div>
		</div>
	{/if}
</dialog>
