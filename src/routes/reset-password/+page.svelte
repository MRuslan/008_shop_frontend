<script lang="ts">
	import { page } from '$app/state';
	import { invalidateAll, replaceState } from '$app/navigation';
	import { authApi } from '$lib/api/auth';
	import { authStore } from '$lib/stores/auth';
	import { getErrorMessage, getFieldErrors } from '$lib/utils/errors';

	const PASSWORD_MIN = 6;

	// Ссылка из письма: /reset-password?token=<64 hex>
	const token = page.url.searchParams.get('token')?.trim() ?? '';

	let password = $state('');
	let confirmPassword = $state('');
	let submitted = $state(false);
	let isLoading = $state(false);
	let error = $state<string | null>(null);
	let done = $state(false);

	const fieldErrors = $derived({
		password: password.length < PASSWORD_MIN ? `Пароль должен быть не короче ${PASSWORD_MIN} символов` : null,
		confirm: confirmPassword !== password ? 'Пароли не совпадают' : null
	});

	function openLogin(mode: 'login' | 'forgot' = 'login') {
		window.dispatchEvent(new CustomEvent('open-auth-modal', { detail: { mode } }));
	}

	async function handleSubmit() {
		submitted = true;
		error = null;
		if (fieldErrors.password || fieldErrors.confirm) return;

		isLoading = true;
		try {
			await authApi.resetPassword(token, password);
			// Бэкенд отозвал все сессии аккаунта. В этом браузере мог быть вход (этим или другим аккаунтом):
			// выходим, чтобы шапка не показывала недействительный вход
			if ($authStore.isAuthenticated) {
				await authStore.logout();
				await invalidateAll();
			}
			done = true;
			// Одноразовый токен больше не нужен в адресной строке и истории
			replaceState(page.url.pathname, {});
		} catch (err) {
			const byField = getFieldErrors(err);
			// Токен не того формата — ссылку обрезал почтовик или её скопировали не целиком
			error = byField.token
				? 'Ссылка повреждена. Откройте её из письма целиком или запросите новое письмо.'
				: (byField.newPassword ?? getErrorMessage(err, 'Не удалось сменить пароль. Запросите новое письмо.'));
		} finally {
			isLoading = false;
		}
	}

	const inputClass =
		'field w-full';
</script>

<svelte:head>
	<title>Новый пароль</title>
	<meta name="robots" content="noindex" />
	<!-- Токен в адресе не должен уходить сторонним сайтам в заголовке Referer -->
	<meta name="referrer" content="no-referrer" />
</svelte:head>

<div class="container py-8 md:py-12">
	<div class="mx-auto max-w-md rounded-2xl bg-surface p-6">
		<h1 class="text-headline text-balance text-ink">Новый пароль</h1>

		{#if done}
			<div class="mt-4 space-y-4" role="status">
				<p class="text-body text-gray-800">Пароль изменён. Войдите с новым паролем.</p>
				<p class="text-body-sm text-gray-600">На других устройствах тоже нужно будет войти заново.</p>
				<button
					type="button"
					onclick={() => openLogin()}
					class="w-full btn-primary"
				>
					Войти
				</button>
			</div>
		{:else if !token}
			<div class="mt-4 space-y-4">
				<p class="text-body text-gray-800">
					В ссылке нет кода восстановления. Откройте ссылку из письма целиком или запросите новое письмо.
				</p>
				<button
					type="button"
					onclick={() => openLogin('forgot')}
					class="w-full btn-primary"
				>
					Запросить новое письмо
				</button>
			</div>
		{:else}
			<form
				onsubmit={(e) => {
					e.preventDefault();
					handleSubmit();
				}}
				class="mt-4 space-y-4"
				novalidate
			>
				{#if error}
					<div role="alert" class="notice-error">
						<p>{error}</p>
						<button
							type="button"
							onclick={() => openLogin('forgot')}
							class="mt-2 inline-flex min-h-11 items-center font-medium underline underline-offset-4"
						>
							Запросить новое письмо
						</button>
					</div>
				{/if}

				<div>
					<label for="reset-password" class="field-label">Новый пароль</label>
					<input
						id="reset-password"
						type="password"
						bind:value={password}
						required
						autocomplete="new-password"
						disabled={isLoading}
						aria-invalid={submitted && !!fieldErrors.password}
						aria-describedby="reset-password-hint"
						class={inputClass}
					/>
					<p
						id="reset-password-hint"
						class={submitted && fieldErrors.password ? 'field-error' : 'field-hint'}
					>
						{submitted && fieldErrors.password ? fieldErrors.password : `Не короче ${PASSWORD_MIN} символов.`}
					</p>
				</div>

				<div>
					<label for="reset-confirm" class="field-label">Повторите пароль</label>
					<input
						id="reset-confirm"
						type="password"
						bind:value={confirmPassword}
						required
						autocomplete="new-password"
						disabled={isLoading}
						aria-invalid={submitted && !!fieldErrors.confirm}
						aria-describedby={submitted && fieldErrors.confirm ? 'reset-confirm-error' : undefined}
						class={inputClass}
					/>
					{#if submitted && fieldErrors.confirm}
						<p id="reset-confirm-error" class="field-error">{fieldErrors.confirm}</p>
					{/if}
				</div>

				<button
					type="submit"
					disabled={isLoading}
					class="w-full btn-primary"
				>
					{isLoading ? 'Сохраняем…' : 'Сохранить пароль'}
				</button>
			</form>
		{/if}
	</div>
</div>
