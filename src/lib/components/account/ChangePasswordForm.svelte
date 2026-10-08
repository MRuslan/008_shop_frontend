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
		'field w-full md:w-80';
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
		<div role="alert" class="notice-error">{error}</div>
	{/if}

	<div>
		<label for="current-password" class="field-label">Текущий пароль</label>
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
			<p id="current-password-error" class="field-error">{shown.currentPassword}</p>
		{/if}
	</div>

	<div>
		<label for="new-password" class="field-label">Новый пароль</label>
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
		<p id="new-password-hint" class={shown.newPassword ? 'field-error' : 'field-hint'}>
			{shown.newPassword ?? `Не короче ${PASSWORD_MIN} символов. Другие устройства выйдут из аккаунта.`}
		</p>
	</div>

	<div>
		<label for="confirm-new-password" class="field-label">Повторите новый пароль</label>
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
			<p id="confirm-new-password-error" class="field-error">{shown.confirm}</p>
		{/if}
	</div>

	<div class="flex flex-wrap gap-2">
		<button
			type="submit"
			disabled={isSaving}
			class="btn-primary"
		>
			{isSaving ? 'Сохраняем…' : 'Сменить пароль'}
		</button>
		<button
			type="button"
			onclick={onDone}
			class="btn-secondary"
		>
			Отмена
		</button>
	</div>
</form>
