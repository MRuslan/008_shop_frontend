<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import LoginForm from './LoginForm.svelte';
	import RegisterForm from './RegisterForm.svelte';

	interface Props {
		mode?: 'login' | 'register';
		open?: boolean;
	}

	let { mode = $bindable('login'), open = $bindable(false) }: Props = $props();

	function close() {
		open = false;
	}

	function switchMode(newMode: 'login' | 'register') {
		mode = newMode;
	}

	function handleAuthSuccess() {
		close();
	}

	// Слушаем событие успешной авторизации
	onMount(() => {
		if (typeof window !== 'undefined') {
			window.addEventListener('auth:success', handleAuthSuccess);
		}
	});

	onDestroy(() => {
		if (typeof window !== 'undefined') {
			window.removeEventListener('auth:success', handleAuthSuccess);
		}
	});
</script>

{#if open}
	<div
		class="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
		onclick={close}
		role="dialog"
		aria-modal="true"
	>
		<div
			class="bg-white rounded-lg shadow-xl max-w-md w-full p-6"
			onclick={(e) => e.stopPropagation()}
		>
			<!-- Header -->
			<div class="flex items-center justify-between mb-6">
				<div class="flex space-x-4">
					<button
						onclick={() => switchMode('login')}
						class="px-4 py-2 font-medium transition-colors"
						class:text-blue-600={mode === 'login'}
						class:text-gray-500={mode !== 'login'}
						class:border-b-2={mode === 'login'}
						class:border-blue-600={mode === 'login'}
					>
						Вход
					</button>
					<button
						onclick={() => switchMode('register')}
						class="px-4 py-2 font-medium transition-colors"
						class:text-blue-600={mode === 'register'}
						class:text-gray-500={mode !== 'register'}
						class:border-b-2={mode === 'register'}
						class:border-blue-600={mode === 'register'}
					>
						Регистрация
					</button>
				</div>
				<button
					onclick={close}
					class="text-gray-400 hover:text-gray-600 transition-colors"
					aria-label="Закрыть"
				>
					<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M6 18L18 6M6 6l12 12"
						/>
					</svg>
				</button>
			</div>

			<!-- Form -->
			{#if mode === 'login'}
				<LoginForm />
			{:else}
				<RegisterForm />
			{/if}
		</div>
	</div>
{/if}
