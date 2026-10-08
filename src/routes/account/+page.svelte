<script lang="ts">
	import { authStore } from '$lib/stores/auth';
	import { authApi } from '$lib/api/auth';
	import { goto } from '$app/navigation';
	import { getErrorMessage, getFieldErrors } from '$lib/utils/errors';
	import { toast } from '$lib/stores/toast';
	import ChangePasswordForm from '$lib/components/account/ChangePasswordForm.svelte';
	import EmailChange from '$lib/components/account/EmailChange.svelte';

	const USERNAME_MIN = 3;

	// Имя правится на месте; email меняется через письмо (блок ниже), роль — только администратором
	let editingName = $state(false);
	let nameDraft = $state('');
	let nameError = $state<string | null>(null);
	let savingName = $state(false);
	let changingPassword = $state(false);
	// Смена пароля гасит ожидающую смену email на бэкенде: после неё перечитываем заявку
	let emailChange: ReturnType<typeof EmailChange> | undefined = $state();

	function startEditingName() {
		nameDraft = $authStore.user?.username ?? '';
		nameError = null;
		editingName = true;
	}

	async function saveName() {
		const value = nameDraft.trim();
		if (value.length < USERNAME_MIN) {
			nameError = `Имя должно быть не короче ${USERNAME_MIN} символов`;
			return;
		}
		if (value === $authStore.user?.username) {
			editingName = false;
			return;
		}
		savingName = true;
		nameError = null;
		try {
			const user = await authApi.updateProfile(value);
			authStore.patchUser({ username: user.username });
			editingName = false;
			toast.success('Имя сохранено');
		} catch (err) {
			nameError = getFieldErrors(err).username ?? getErrorMessage(err, 'Не удалось сохранить имя.');
		} finally {
			savingName = false;
		}
	}

	let isDeleting = $state(false);
	let showDeleteConfirm = $state(false);
	let deletePassword = $state('');
	let deleteError = $state<string | null>(null);

	// Роль показываем только сотрудникам: покупателю служебное слово «customer» ничего не говорит
	const ROLE_LABELS: Record<string, string> = {
		admin: 'Администратор',
		manager: 'Менеджер',
		moderator: 'Модератор',
		support: 'Поддержка'
	};
	const roleLabel = $derived($authStore.user ? (ROLE_LABELS[$authStore.user.role] ?? null) : null);

	// Вход есть, а профиль бэкенд не отдал (перегрузка, перезапуск): даём повторить, не выкидывая из кабинета
	let reloadingProfile = $state(false);
	let profileStillMissing = $state(false);

	async function retryProfile() {
		reloadingProfile = true;
		profileStillMissing = !(await authStore.loadProfile());
		reloadingProfile = false;
	}

	async function handleDeleteAccount() {
		if (!deletePassword.trim()) {
			deleteError = 'Введите пароль, чтобы подтвердить удаление.';
			return;
		}

		isDeleting = true;
		deleteError = null;

		try {
			await authApi.deleteAccount({ password: deletePassword });
			// Сессия удалённого аккаунта уже недействительна: стираем cookie и уходим с перечитыванием данных
			await authStore.logout();
			await goto('/', { invalidateAll: true });
		} catch (err) {
			deleteError = getErrorMessage(err, 'Не удалось удалить аккаунт. Попробуйте ещё раз.');
		} finally {
			isDeleting = false;
		}
	}
</script>

<svelte:head>
	<title>Профиль — Личный кабинет</title>
	<meta name="robots" content="noindex" />
</svelte:head>

<div class="rounded-2xl bg-surface p-5 md:p-6">
	<h1 class="text-headline text-ink mb-6">Профиль</h1>

	{#if $authStore.user}
		<div class="space-y-6">
			<!-- Информация о пользователе -->
			<div>
				<h2 class="text-title text-ink mb-4">Данные аккаунта</h2>
				<dl class="grid grid-cols-1 md:grid-cols-2 gap-4">
					<div>
						<dt class="text-body-sm text-gray-500">
							{#if editingName}<label for="profile-name">Имя</label>{:else}Имя{/if}
						</dt>
						<dd class="mt-0.5 text-body text-ink">
							{#if editingName}
								<form
									onsubmit={(e) => {
										e.preventDefault();
										saveName();
									}}
									class="space-y-2"
									novalidate
								>
									<input
										id="profile-name"
										type="text"
										bind:value={nameDraft}
										autocomplete="nickname"
										maxlength="255"
										disabled={savingName}
										aria-invalid={!!nameError}
										aria-describedby="profile-name-hint"
										class="w-full field"
									/>
									<p id="profile-name-hint" class="text-body-sm {nameError ? 'text-negative' : 'text-gray-500'}">
										{nameError ?? 'Его видят в ваших отзывах.'}
									</p>
									<div class="flex gap-2">
										<button
											type="submit"
											disabled={savingName}
											class="btn-primary"
										>
											{savingName ? 'Сохраняем…' : 'Сохранить'}
										</button>
										<button
											type="button"
											onclick={() => (editingName = false)}
											class="btn-secondary"
										>
											Отмена
										</button>
									</div>
								</form>
							{:else}
								<span class="break-words">{$authStore.user.username}</span>
								<button
									type="button"
									onclick={startEditingName}
									aria-label="Изменить имя"
									class="ml-2 inline-flex min-h-11 items-center text-body-sm text-gray-600 underline-offset-4 hover:text-ink hover:underline"
								>
									Изменить
								</button>
							{/if}
						</dd>
					</div>
					{#if roleLabel}
						<div>
							<dt class="text-body-sm text-gray-500">Роль</dt>
							<dd class="mt-0.5 text-body text-ink">{roleLabel}</dd>
						</div>
					{/if}
				</dl>
			</div>

			<EmailChange bind:this={emailChange} currentEmail={$authStore.user.email} />

			<!-- Пароль -->
			<div class="border-t border-line pt-6">
				<h2 class="text-title text-ink mb-2">Пароль</h2>
				{#if changingPassword}
					<ChangePasswordForm
						onDone={() => {
							changingPassword = false;
							emailChange?.refresh();
						}}
					/>
				{:else}
					<p class="mb-4 text-body-sm text-gray-600">После смены пароля на других устройствах нужно будет войти заново.</p>
					<button
						type="button"
						onclick={() => (changingPassword = true)}
						class="btn-secondary"
					>
						Сменить пароль
					</button>
				{/if}
			</div>

			<!-- Удаление аккаунта -->
			<div class="border-t border-line pt-6">
				<h2 class="text-title text-ink mb-2">Удаление аккаунта</h2>
				<p class="mb-4 text-body-sm text-gray-600">Аккаунт удалится безвозвратно, восстановить его не получится.</p>
				
				{#if !showDeleteConfirm}
					<button
						onclick={() => showDeleteConfirm = true}
						class="btn-secondary text-negative"
					>
						Удалить аккаунт
					</button>
				{:else}
					<div class="space-y-4">
						<p class="text-body-sm text-gray-600">
							Чтобы подтвердить удаление, введите пароль от аккаунта.
						</p>
						
						{#if deleteError}
							<div role="alert" class="notice-error">
								{deleteError}
							</div>
						{/if}

						<div>
							<label for="delete-password" class="field-label">
								Пароль
							</label>
							<input
								id="delete-password"
								type="password"
								bind:value={deletePassword}
								autocomplete="current-password"
								class="w-full md:w-64 field"
							/>
						</div>

						<div class="flex gap-1">
							<button
								onclick={handleDeleteAccount}
								disabled={isDeleting}
								class="btn-danger"
							>
								{isDeleting ? 'Удаляем аккаунт…' : 'Удалить аккаунт навсегда'}
							</button>
							<button
								onclick={() => {
									showDeleteConfirm = false;
									deletePassword = '';
									deleteError = null;
								}}
								class="btn-secondary"
							>
								Отмена
							</button>
						</div>
					</div>
				{/if}
			</div>
		</div>
	{:else}
		<div role="alert" class="notice-error">
			{profileStillMissing
				? 'Сервер магазина всё ещё не отвечает. Попробуйте через минуту.'
				: 'Не удалось загрузить данные профиля: сервер магазина не ответил. Вход сохранён.'}
		</div>
		<button type="button" onclick={retryProfile} disabled={reloadingProfile} class="btn-secondary mt-4">
			{reloadingProfile ? 'Загружаем…' : 'Попробовать снова'}
		</button>
	{/if}
</div>
