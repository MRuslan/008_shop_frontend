<script lang="ts">
	import { authApi } from '$lib/api/auth';
	import { authStore } from '$lib/stores/auth';
	import type { LoginDto } from '$lib/types/auth';

	let email = $state('');
	let password = $state('');
	let error = $state<string | null>(null);
	let isLoading = $state(false);

	async function handleSubmit() {
		error = null;
		isLoading = true;

		try {
			const data: LoginDto = { email, password };
			const response = await authApi.login(data);
			authStore.setUser(response.user);
			
			// Закрываем модальное окно через событие
			window.dispatchEvent(new CustomEvent('auth:success'));
		} catch (err: any) {
			error = err.message || 'Ошибка входа. Проверьте email и пароль.';
		} finally {
			isLoading = false;
		}
	}
</script>

<form onsubmit={(e) => { e.preventDefault(); handleSubmit(); }} class="space-y-4">
	{#if error}
		<div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
			{error}
		</div>
	{/if}

	<div>
		<label for="login-email" class="block text-sm font-medium text-gray-700 mb-1">
			Email
		</label>
		<input
			id="login-email"
			type="email"
			bind:value={email}
			required
			disabled={isLoading}
			class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
			placeholder="your@email.com"
		/>
	</div>

	<div>
		<label for="login-password" class="block text-sm font-medium text-gray-700 mb-1">
			Пароль
		</label>
		<input
			id="login-password"
			type="password"
			bind:value={password}
			required
			disabled={isLoading}
			class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
			placeholder="••••••••"
		/>
	</div>

	<button
		type="submit"
		disabled={isLoading}
		class="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
	>
		{isLoading ? 'Вход...' : 'Войти'}
	</button>
</form>
