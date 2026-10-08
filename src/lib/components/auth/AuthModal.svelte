<script lang="ts">
	import { tick } from 'svelte';
	import LoginForm from './LoginForm.svelte';
	import RegisterForm from './RegisterForm.svelte';
	import ForgotPasswordForm from './ForgotPasswordForm.svelte';
	import X from '@lucide/svelte/icons/x';

	// forgot — восстановление пароля: не вкладка, а отдельный шаг из формы входа
	type Mode = 'login' | 'register' | 'forgot';

	interface Props {
		mode?: Mode;
		open?: boolean;
		/** Зачем просим войти: показывается над формой, если окно открыто ради конкретного действия */
		reason?: string | null;
	}

	let { mode = $bindable('login'), open = $bindable(false), reason = null }: Props = $props();

	// Email, который покупатель уже ввёл при регистрации, переносится в форму входа
	let loginEmail = $state('');

	// Нативный <dialog>: ловушка фокуса, Escape, верхний слой и возврат фокуса на кнопку-триггер бесплатно
	let dialog: HTMLDialogElement | undefined = $state();

	const tabs: Array<{ id: 'login' | 'register'; label: string }> = [
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
		loginEmail = '';
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

	function openForgot(email: string) {
		loginEmail = email;
		mode = 'forgot';
		focusFirstField();
	}

	async function switchToLoginWithEmail(email: string) {
		loginEmail = email;
		mode = 'login';
		await tick();
		dialog?.querySelector<HTMLInputElement>('#login-password')?.focus();
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
	aria-label={mode === 'login' ? 'Вход в аккаунт' : mode === 'register' ? 'Регистрация' : 'Восстановление пароля'}
	class="m-auto w-[calc(100%-2rem)] max-w-md rounded-2xl bg-surface p-0 text-gray-900 shadow-[0_8px_24px_rgb(0_0_0/0.18)] backdrop:bg-black/40"
>
	{#if open}
		<div class="p-5 md:p-6">
			<div class="mb-6 flex items-center justify-between gap-4">
				{#if mode === 'forgot'}
					<h2 class="text-title text-ink">Восстановление пароля</h2>
				{:else}
				<div
					role="tablist"
					tabindex="-1"
					aria-label="Вход или регистрация"
					class="flex gap-1 rounded-xl bg-gray-100 p-1"
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
							class="min-h-11 rounded-lg px-4 text-control transition-colors {mode === tab.id
								? 'bg-surface text-ink'
								: 'text-gray-600 hover:text-ink'}"
						>
							{tab.label}
						</button>
					{/each}
				</div>
				{/if}
				<button
					type="button"
					onclick={close}
					class="-mr-2 inline-flex size-11 shrink-0 items-center justify-center rounded-xl text-gray-500 transition-colors hover:bg-gray-100 hover:text-ink"
					aria-label="Закрыть окно входа"
				>
					<X class="size-5" aria-hidden="true" />
				</button>
			</div>

			{#if reason && mode !== 'forgot'}
				<p class="mb-4 text-body-sm text-gray-600">{reason}</p>
			{/if}

			{#if mode === 'forgot'}
				<ForgotPasswordForm initialEmail={loginEmail} onBack={() => switchToLoginWithEmail(loginEmail)} />
			{:else}
				<div id="auth-panel" role="tabpanel" aria-labelledby="auth-tab-{mode}">
					{#if mode === 'login'}
						<LoginForm initialEmail={loginEmail} onForgot={openForgot} />
					{:else}
						<RegisterForm onSwitchToLogin={switchToLoginWithEmail} />
					{/if}
				</div>
			{/if}
		</div>
	{/if}
</dialog>
