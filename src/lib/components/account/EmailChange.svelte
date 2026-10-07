<script lang="ts">
	import { onMount } from 'svelte';
	import { authApi } from '$lib/api/auth';
	import type { PendingEmailChange } from '$lib/types/auth';
	import { toast } from '$lib/stores/toast';
	import { confirmDialog } from '$lib/stores/confirm';
	import { getErrorMessage, getFieldErrors, isApiError } from '$lib/utils/errors';
	import { formatDateTime } from '$lib/utils/format';

	interface Props {
		currentEmail: string;
	}

	let { currentEmail }: Props = $props();

	const EMAIL_PATTERN = /^\S+@\S+\.\S+$/;

	// Заявка на смену: email меняется только после перехода по ссылке из письма на новый адрес
	let pending = $state<PendingEmailChange | null>(null);
	// Старый бэкенд без смены email отвечает 404: тогда блок не показываем вовсе
	let supported = $state(true);

	let formOpen = $state(false);
	let newEmail = $state('');
	let password = $state('');
	let submitted = $state(false);
	let saving = $state(false);
	let cancelling = $state(false);
	let error = $state<string | null>(null);
	let serverErrors = $state<Record<string, string>>({});

	const fieldErrors = $derived({
		newEmail: !EMAIL_PATTERN.test(newEmail.trim())
			? 'Проверьте email: в адресе есть ошибка'
			: newEmail.trim().toLowerCase() === currentEmail.toLowerCase()
				? 'Это ваш текущий адрес'
				: null,
		password: password ? null : 'Введите текущий пароль'
	});
	const shown = $derived({
		newEmail: (submitted && fieldErrors.newEmail) || serverErrors.newEmail || null,
		password: (submitted && fieldErrors.password) || serverErrors.password || null
	});

	/** Перечитать заявку: её гасят смена пароля, блокировка и удаление аккаунта */
	export async function refresh() {
		try {
			pending = await authApi.getEmailChange();
		} catch (err) {
			if (isApiError(err) && err.statusCode === 404) supported = false;
		}
	}

	onMount(refresh);

	function openForm(prefill = '') {
		newEmail = prefill;
		password = '';
		submitted = false;
		error = null;
		serverErrors = {};
		formOpen = true;
	}

	async function handleSubmit() {
		submitted = true;
		error = null;
		serverErrors = {};
		if (fieldErrors.newEmail || fieldErrors.password) return;

		saving = true;
		try {
			const result = await authApi.changeEmail(newEmail.trim(), password);
			pending = { pendingEmail: result.pendingEmail, expiresAt: result.expiresAt };
			formOpen = false;
			toast.success(`Ссылка для подтверждения отправлена на ${result.pendingEmail}`);
		} catch (err) {
			const byField = getFieldErrors(err);
			if (Object.keys(byField).length) {
				serverErrors = byField;
			} else if (isApiError(err) && err.statusCode === 409) {
				serverErrors = { newEmail: getErrorMessage(err, 'Этот адрес уже занят другим аккаунтом') };
			} else {
				const message = getErrorMessage(err, 'Не удалось отправить ссылку. Попробуйте ещё раз.');
				// «Неверный пароль» показываем у поля пароля: там его и исправлять
				if (/парол/i.test(message)) serverErrors = { password: message };
				else error = message;
			}
		} finally {
			saving = false;
		}
	}

	async function cancelChange() {
		const confirmed = await confirmDialog({
			title: 'Отменить смену email?',
			message: `Ссылка, отправленная на ${pending?.pendingEmail}, перестанет работать. Вход останется по ${currentEmail}.`,
			confirmLabel: 'Отменить смену',
			cancelLabel: 'Оставить'
		});
		if (!confirmed) return;

		cancelling = true;
		try {
			await authApi.cancelEmailChange();
			pending = { pendingEmail: null, expiresAt: null };
			toast.success('Смена email отменена');
		} catch (err) {
			toast.error(getErrorMessage(err, 'Не удалось отменить смену email.'));
		} finally {
			cancelling = false;
		}
	}

	const inputClass =
		'min-h-11 w-full rounded-md border border-gray-300 px-3 py-2 text-base focus:ring-2 focus:ring-blue-500 focus:outline-none aria-invalid:border-red-500 md:w-80';
</script>

{#if supported}
	<div class="border-t pt-6">
		<h2 class="text-title text-ink mb-2">Email для входа</h2>
		<p class="mb-4 text-body text-ink break-all">{currentEmail}</p>

		{#if pending?.pendingEmail && !formOpen}
			<!-- Заявка ждёт подтверждения: до перехода по ссылке вход по прежнему адресу -->
			<div class="mb-4 rounded-md border border-amber-300 bg-amber-50 px-4 py-3" role="status">
				<p class="text-body-sm text-gray-900">
					Ожидает подтверждения: <span class="font-medium break-all">{pending.pendingEmail}</span>
				</p>
				<p class="mt-1 text-body-sm text-gray-600">
					Откройте ссылку из письма на этот адрес{pending.expiresAt
						? `, она действует до ${formatDateTime(pending.expiresAt)}`
						: ''}. Пока адрес не подтверждён, входите по прежнему.
				</p>
				<div class="mt-3 flex flex-wrap gap-2">
					<button
						type="button"
						onclick={() => openForm(pending?.pendingEmail ?? '')}
						class="min-h-11 rounded-md border border-gray-300 bg-white px-4 text-control transition-colors hover:bg-gray-50"
					>
						Отправить ещё раз
					</button>
					<button
						type="button"
						onclick={cancelChange}
						disabled={cancelling}
						class="min-h-11 rounded-md px-4 text-control text-gray-700 transition-colors hover:bg-gray-100 disabled:opacity-50"
					>
						{cancelling ? 'Отменяем…' : 'Отменить смену'}
					</button>
				</div>
			</div>
		{/if}

		{#if formOpen}
			<form
				onsubmit={(e) => {
					e.preventDefault();
					handleSubmit();
				}}
				class="space-y-4"
				novalidate
			>
				<p class="text-body-sm text-gray-600">
					На новый адрес придёт письмо со ссылкой. Email сменится, когда вы её откроете.
				</p>

				{#if error}
					<div role="alert" class="rounded border border-red-400 bg-red-100 px-4 py-3 text-red-700">{error}</div>
				{/if}

				<div>
					<label for="new-email" class="mb-1 block text-sm font-medium text-gray-700">Новый email</label>
					<input
						id="new-email"
						type="email"
						bind:value={newEmail}
						oninput={() => (serverErrors = { ...serverErrors, newEmail: '' })}
						autocomplete="email"
						inputmode="email"
						disabled={saving}
						aria-invalid={!!shown.newEmail}
						aria-describedby={shown.newEmail ? 'new-email-error' : undefined}
						class={inputClass}
					/>
					{#if shown.newEmail}
						<p id="new-email-error" class="mt-1 text-sm text-red-700">{shown.newEmail}</p>
					{/if}
				</div>

				<div>
					<label for="email-change-password" class="mb-1 block text-sm font-medium text-gray-700">Текущий пароль</label>
					<input
						id="email-change-password"
						type="password"
						bind:value={password}
						oninput={() => (serverErrors = { ...serverErrors, password: '' })}
						autocomplete="current-password"
						disabled={saving}
						aria-invalid={!!shown.password}
						aria-describedby="email-change-password-hint"
						class={inputClass}
					/>
					<p
						id="email-change-password-hint"
						class="mt-1 text-sm {shown.password ? 'text-red-700' : 'text-gray-500'}"
					>
						{shown.password ?? 'Чтобы никто другой не сменил адрес, пока вы не у компьютера.'}
					</p>
				</div>

				<div class="flex flex-wrap gap-2">
					<button
						type="submit"
						disabled={saving}
						class="min-h-11 rounded-md bg-blue-600 px-4 text-control text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
					>
						{saving ? 'Отправляем…' : 'Отправить ссылку'}
					</button>
					<button
						type="button"
						onclick={() => (formOpen = false)}
						class="min-h-11 rounded-md border border-gray-300 px-4 text-control transition-colors hover:bg-gray-50"
					>
						Отмена
					</button>
				</div>
			</form>
		{:else if !pending?.pendingEmail}
			<button
				type="button"
				onclick={() => openForm()}
				class="min-h-11 rounded-md border border-gray-300 px-4 text-control transition-colors hover:bg-gray-50"
			>
				Сменить email
			</button>
		{/if}
	</div>
{/if}
