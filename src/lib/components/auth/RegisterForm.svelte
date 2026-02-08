<script lang="ts">
	import { authApi } from '$lib/api/auth';
	import { authStore } from '$lib/stores/auth';
	import type { RegisterDto } from '$lib/types/auth';

	let email = $state('');
	let username = $state('');
	let password = $state('');
	let confirmPassword = $state('');
	let error = $state<string | null>(null);
	let isLoading = $state(false);

	async function handleSubmit() {
		error = null;

		// Валидация
		if (password !== confirmPassword) {
			error = 'Пароли не совпадают';
			return;
		}

		if (password.length < 6) {
			error = 'Пароль должен содержать минимум 6 символов';
			return;
		}

		if (username.length < 3) {
			error = 'Имя пользователя должно содержать минимум 3 символа';
			return;
		}

		isLoading = true;

		try {
			const data: RegisterDto = { email, username, password };
			const response = await authApi.register(data);
			await authStore.setUser(response.user);
			
			// Закрываем модальное окно через событие
			window.dispatchEvent(new CustomEvent('auth:success'));
		} catch (err: any) {
			const message = err.message;
			if (Array.isArray(message)) {
				error = message.join(', ');
			} else {
				error = message || 'Ошибка регистрации. Возможно, email уже используется.';
			}
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
		<label for="register-email" class="block text-sm font-medium text-gray-700 mb-1">
			Email
		</label>
		<input
			id="register-email"
			type="email"
			bind:value={email}
			required
			disabled={isLoading}
			class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
			placeholder="your@email.com"
		/>
	</div>

	<div>
		<label for="register-username" class="block text-sm font-medium text-gray-700 mb-1">
			Имя пользователя
		</label>
		<input
			id="register-username"
			type="text"
			bind:value={username}
			required
			minlength="3"
			disabled={isLoading}
			class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
			placeholder="username"
		/>
	</div>

	<div>
		<label for="register-password" class="block text-sm font-medium text-gray-700 mb-1">
			Пароль
		</label>
		<input
			id="register-password"
			type="password"
			bind:value={password}
			required
			minlength="6"
			disabled={isLoading}
			class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
			placeholder="••••••••"
		/>
	</div>

	<div>
		<label for="register-confirm-password" class="block text-sm font-medium text-gray-700 mb-1">
			Подтвердите пароль
		</label>
		<input
			id="register-confirm-password"
			type="password"
			bind:value={confirmPassword}
			required
			minlength="6"
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
		{isLoading ? 'Регистрация...' : 'Зарегистрироваться'}
	</button>
</form>
