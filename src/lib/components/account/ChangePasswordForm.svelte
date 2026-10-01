<script lang="ts">
	import { authApi } from '$lib/api/auth';
	import { toast } from '$lib/stores/toast';
	import { getErrorMessage, getFieldErrors } from '$lib/utils/errors';
	import { pluralize } from '$lib/utils/format';

	interface Props {
		onDone: () => void;
	}

	let { onDone }: Props = $props();

	const PASSWORD_MIN = 6;

	let currentPassword = $state('');
	let newPassword = $state('');
	let confirmPassword = $state('');
	let submitted = $state(false);
	let isSaving = $state(false);
	let error = $state<string | null>(null);
	let serverErrors = $state<Record<string, string>>({});

	const fieldErrors = $derived({
		currentPassword: currentPassword ? null : 'Введите текущий пароль',
		newPassword:
			newPassword.length < PASSWORD_MIN
				? `Пароль должен быть не короче ${PASSWORD_MIN} символов`
				: newPassword === currentPassword
					? 'Новый пароль совпадает с текущим'
					: null,
		confirm: confirmPassword !== newPassword ? 'Пароли не совпадают' : null
	});

	const shown = $derived({
		currentPassword: (submitted && fieldErrors.currentPassword) || serverErrors.currentPassword || null,
		newPassword: (submitted && fieldErrors.newPassword) || serverErrors.newPassword || null,
		confirm: submitted ? fieldErrors.confirm : null
	});

	async function handleSubmit() {
		submitted = true;
		error = null;
		serverErrors = {};
		if (Object.values(fieldErrors).some(Boolean)) return;

		isSaving = true;
		try {
			const result = await authApi.changePassword(currentPassword, newPassword);
			const others = result.revokedSessions ?? 0;
			toast.success(
				others > 0
					? `Пароль изменён. На ${others} ${pluralize(others, ['другом устройстве', 'других устройствах', 'других устройствах'])} нужно будет войти заново.`
					: 'Пароль изменён'
			);
			onDone();
		} catch (err) {
			const byField = getFieldErrors(err);
			if (Object.keys(byField).length) serverErrors = byField;
			else error = getErrorMessage(err, 'Не удалось сменить пароль. Попробуйте ещё раз.');
		} finally {
			isSaving = false;
		}
	}

	const inputClass =
		'min-h-11 w-full rounded-md border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none aria-invalid:border-red-500 md:w-80';
</script>

<form
	onsubmit={(e) => {
		e.preventDefault();
		handleSubmit();
	}}
	class="space-y-4"
	novalidate
>
	{#if error}
		<div role="alert" class="rounded border border-red-400 bg-red-100 px-4 py-3 text-red-700">{error}</div>
	{/if}

	<div>
		<label for="current-password" class="mb-1 block text-sm font-medium text-gray-700">Текущий пароль</label>
		<input
			id="current-password"
			type="password"
			bind:value={currentPassword}
			autocomplete="current-password"
			disabled={isSaving}
			aria-invalid={!!shown.currentPassword}
			aria-describedby={shown.currentPassword ? 'current-password-error' : undefined}
			class={inputClass}
		/>
		{#if shown.currentPassword}
			<p id="current-password-error" class="mt-1 text-sm text-red-700">{shown.currentPassword}</p>
		{/if}
	</div>

	<div>
		<label for="new-password" class="mb-1 block text-sm font-medium text-gray-700">Новый пароль</label>
		<input
			id="new-password"
			type="password"
			bind:value={newPassword}
			autocomplete="new-password"
			disabled={isSaving}
			aria-invalid={!!shown.newPassword}
			aria-describedby="new-password-hint"
			class={inputClass}
		/>
		<p id="new-password-hint" class="mt-1 text-sm {shown.newPassword ? 'text-red-700' : 'text-gray-500'}">
			{shown.newPassword ?? `Не короче ${PASSWORD_MIN} символов. Другие устройства выйдут из аккаунта.`}
		</p>
	</div>

	<div>
		<label for="confirm-new-password" class="mb-1 block text-sm font-medium text-gray-700">Повторите новый пароль</label>
		<input
			id="confirm-new-password"
			type="password"
			bind:value={confirmPassword}
			autocomplete="new-password"
			disabled={isSaving}
			aria-invalid={!!shown.confirm}
			aria-describedby={shown.confirm ? 'confirm-new-password-error' : undefined}
			class={inputClass}
		/>
		{#if shown.confirm}
			<p id="confirm-new-password-error" class="mt-1 text-sm text-red-700">{shown.confirm}</p>
		{/if}
	</div>

	<div class="flex flex-wrap gap-2">
		<button
			type="submit"
			disabled={isSaving}
			class="min-h-11 rounded-md bg-blue-600 px-4 text-control text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
		>
			{isSaving ? 'Сохраняем…' : 'Сменить пароль'}
		</button>
		<button
			type="button"
			onclick={onDone}
			class="min-h-11 rounded-md border border-gray-300 px-4 text-control transition-colors hover:bg-gray-50"
		>
			Отмена
		</button>
	</div>
</form>
