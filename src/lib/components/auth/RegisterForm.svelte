<script lang="ts">
	import { authApi } from '$lib/api/auth';
	import { authStore } from '$lib/stores/auth';
	import type { RegisterDto } from '$lib/types/auth';
	import { getErrorMessage, getFieldErrors, isApiError } from '$lib/utils/errors';

	interface Props {
		/** Email уже зарегистрирован: предлагаем войти, перенося введённый адрес */
		onSwitchToLogin?: (email: string) => void;
	}

	let { onSwitchToLogin }: Props = $props();

	const USERNAME_MIN = 3;
	const PASSWORD_MIN = 6;

	let email = $state('');
	let username = $state('');
	let password = $state('');
	let confirmPassword = $state('');
	let error = $state<string | null>(null);
	let emailTaken = $state(false);
	let isLoading = $state(false);

	// Ошибки полей показываем после первой попытки отправки, а дальше пересчитываем на лету
	let submitted = $state(false);
	const fieldErrors = $derived({
		email: /^\S+@\S+\.\S+$/.test(email.trim()) ? null : 'Проверьте email: в адресе есть ошибка',
		username:
			username.trim().length < USERNAME_MIN ? `Имя должно быть не короче ${USERNAME_MIN} символов` : null,
		password: password.length < PASSWORD_MIN ? `Пароль должен быть не короче ${PASSWORD_MIN} символов` : null,
		confirm: confirmPassword !== password ? 'Пароли не совпадают' : null
	});
	const hasFieldErrors = $derived(Object.values(fieldErrors).some(Boolean));

	// Сервер проверяет строже формы (например, домен email). Его ошибка висит у поля, пока поле не изменят
	let serverErrors = $state<Record<string, string>>({});
	let sentValues = { email: '', username: '', password: '' };
	const shown = $derived({
		email: (submitted && fieldErrors.email) || (email.trim() === sentValues.email ? serverErrors.email : null) || null,
		username:
			(submitted && fieldErrors.username) ||
			(username.trim() === sentValues.username ? serverErrors.username : null) ||
			null,
		password:
			(submitted && fieldErrors.password) || (password === sentValues.password ? serverErrors.password : null) || null,
		confirm: submitted ? fieldErrors.confirm : null
	});

	async function handleSubmit() {
		submitted = true;
		error = null;
		emailTaken = false;
		serverErrors = {};
		if (hasFieldErrors) return;

		isLoading = true;

		try {
			const data: RegisterDto = { email: email.trim(), username: username.trim(), password };
			sentValues = { email: data.email, username: data.username, password };
			const response = await authApi.register(data);
			await authStore.setUser(response.user);

			// Закрываем модальное окно через событие
			window.dispatchEvent(new CustomEvent('auth:success'));
		} catch (err) {
			emailTaken = isApiError(err) && err.statusCode === 409;
			const byField = getFieldErrors(err);
			const known = ['email', 'username', 'password'];
			if (Object.keys(byField).length && Object.keys(byField).every((field) => known.includes(field))) {
				serverErrors = byField;
			} else {
				error = getErrorMessage(err, 'Не удалось создать аккаунт. Попробуйте ещё раз.');
			}
		} finally {
			isLoading = false;
		}
	}

	const inputClass =
		'w-full min-h-11 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 aria-invalid:border-red-500';
</script>

<form onsubmit={(e) => { e.preventDefault(); handleSubmit(); }} class="space-y-4" novalidate>
	{#if error}
		<div role="alert" class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
			<p>{error}</p>
			{#if emailTaken && onSwitchToLogin}
				<button
					type="button"
					onclick={() => onSwitchToLogin(email.trim())}
					class="mt-2 inline-flex min-h-11 items-center font-medium underline underline-offset-4"
				>
					Войти с этим email
				</button>
			{/if}
		</div>
	{/if}

	<div>
		<label for="register-email" class="block text-sm font-medium text-gray-700 mb-1">Email</label>
		<input
			id="register-email"
			type="email"
			bind:value={email}
			required
			autocomplete="email"
			inputmode="email"
			disabled={isLoading}
			aria-invalid={!!shown.email}
			aria-describedby={shown.email ? 'register-email-error' : undefined}
			class="{inputClass} border-gray-300"
		/>
		{#if shown.email}
			<p id="register-email-error" class="mt-1 text-sm text-red-700">{shown.email}</p>
		{/if}
	</div>

	<div>
		<label for="register-username" class="block text-sm font-medium text-gray-700 mb-1">Имя</label>
		<input
			id="register-username"
			type="text"
			bind:value={username}
			required
			autocomplete="nickname"
			disabled={isLoading}
			aria-invalid={!!shown.username}
			aria-describedby="register-username-hint"
			class="{inputClass} border-gray-300"
		/>
		<p id="register-username-hint" class="mt-1 text-sm {shown.username ? 'text-red-700' : 'text-gray-500'}">
			{shown.username ?? `Его увидят в ваших отзывах. Не короче ${USERNAME_MIN} символов.`}
		</p>
	</div>

	<div>
		<label for="register-password" class="block text-sm font-medium text-gray-700 mb-1">Пароль</label>
		<input
			id="register-password"
			type="password"
			bind:value={password}
			required
			autocomplete="new-password"
			disabled={isLoading}
			aria-invalid={!!shown.password}
			aria-describedby="register-password-hint"
			class="{inputClass} border-gray-300"
		/>
		<p id="register-password-hint" class="mt-1 text-sm {shown.password ? 'text-red-700' : 'text-gray-500'}">
			{shown.password ?? `Не короче ${PASSWORD_MIN} символов.`}
		</p>
	</div>

	<div>
		<label for="register-confirm-password" class="block text-sm font-medium text-gray-700 mb-1">Повторите пароль</label>
		<input
			id="register-confirm-password"
			type="password"
			bind:value={confirmPassword}
			required
			autocomplete="new-password"
			disabled={isLoading}
			aria-invalid={!!shown.confirm}
			aria-describedby={shown.confirm ? 'register-confirm-error' : undefined}
			class="{inputClass} border-gray-300"
		/>
		{#if shown.confirm}
			<p id="register-confirm-error" class="mt-1 text-sm text-red-700">{shown.confirm}</p>
		{/if}
	</div>

	<button
		type="submit"
		disabled={isLoading}
		class="w-full min-h-11 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-control"
	>
		{isLoading ? 'Создаём аккаунт…' : 'Зарегистрироваться'}
	</button>
</form>
