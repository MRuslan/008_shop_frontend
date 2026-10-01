<script lang="ts">
	import { authApi } from '$lib/api/auth';
	import { authStore } from '$lib/stores/auth';
	import type { LoginDto } from '$lib/types/auth';
	import { getErrorMessage } from '$lib/utils/errors';

	interface Props {
		/** Email, перенесённый из формы регистрации */
		initialEmail?: string;
		/** Забыли пароль: открыть восстановление, перенося введённый email */
		onForgot?: (email: string) => void;
	}

	let { initialEmail = '', onForgot }: Props = $props();

	let email = $state(initialEmail);
	let password = $state('');
	let error = $state<string | null>(null);
	let isLoading = $state(false);

	async function handleSubmit() {
		error = null;
		if (!email.trim() || !password) {
			error = 'Введите email и пароль.';
			return;
		}

		isLoading = true;

		try {
			const data: LoginDto = { email: email.trim(), password };
			const response = await authApi.login(data);
			await authStore.setUser(response.user);

			// Закрываем модальное окно через событие
			window.dispatchEvent(new CustomEvent('auth:success'));
		} catch (err) {
			error = getErrorMessage(err, 'Не удалось войти. Проверьте email и пароль.');
		} finally {
			isLoading = false;
		}
	}
</script>

<form onsubmit={(e) => { e.preventDefault(); handleSubmit(); }} class="space-y-4" novalidate>
	{#if error}
		<div role="alert" class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
			{error}
		</div>
	{/if}

	<div>
		<label for="login-email" class="block text-sm font-medium text-gray-700 mb-1">Email</label>
		<input
			id="login-email"
			type="email"
			bind:value={email}
			required
			autocomplete="email"
			inputmode="email"
			disabled={isLoading}
			class="w-full min-h-11 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
		/>
	</div>

	<div>
		<label for="login-password" class="block text-sm font-medium text-gray-700 mb-1">Пароль</label>
		<input
			id="login-password"
			type="password"
			bind:value={password}
			required
			autocomplete="current-password"
			disabled={isLoading}
			class="w-full min-h-11 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
		/>
		<!-- После поля, а не у подписи: Tab из email ведёт прямо в пароль -->
		{#if onForgot}
			<div class="flex justify-end">
				<button
					type="button"
					onclick={() => onForgot(email.trim())}
					class="-mb-2 inline-flex min-h-11 items-center text-sm text-gray-600 underline-offset-4 hover:text-ink hover:underline"
				>
					Забыли пароль?
				</button>
			</div>
		{/if}
	</div>

	<button
		type="submit"
		disabled={isLoading}
		class="w-full min-h-11 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-control"
	>
		{isLoading ? 'Входим…' : 'Войти'}
	</button>
</form>
