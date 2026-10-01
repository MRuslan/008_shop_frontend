<script lang="ts">
	import { authStore } from '$lib/stores/auth';
	import { authApi } from '$lib/api/auth';
	import { goto } from '$app/navigation';
	import { getErrorMessage, getFieldErrors } from '$lib/utils/errors';
	import { toast } from '$lib/stores/toast';
	import ChangePasswordForm from '$lib/components/account/ChangePasswordForm.svelte';

	const USERNAME_MIN = 3;

	// Имя правится на месте; email и роль меняет только администратор
	let editingName = $state(false);
	let nameDraft = $state('');
	let nameError = $state<string | null>(null);
	let savingName = $state(false);
	let changingPassword = $state(false);

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

	async function handleDeleteAccount() {
		if (!deletePassword.trim()) {
			deleteError = 'Введите пароль, чтобы подтвердить удаление.';
			return;
		}

		isDeleting = true;
		deleteError = null;

		try {
			await authApi.deleteAccount({ password: deletePassword });
			await authStore.logout();
			goto('/');
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

<div class="bg-white rounded-lg shadow-md p-6">
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
										class="min-h-11 w-full rounded-md border border-gray-300 px-3 py-2 text-base focus:ring-2 focus:ring-blue-500 focus:outline-none aria-invalid:border-red-500"
									/>
									<p id="profile-name-hint" class="text-sm {nameError ? 'text-red-700' : 'text-gray-500'}">
										{nameError ?? 'Его видят в ваших отзывах.'}
									</p>
									<div class="flex gap-2">
										<button
											type="submit"
											disabled={savingName}
											class="min-h-11 rounded-md bg-blue-600 px-4 text-control text-white hover:bg-blue-700 disabled:opacity-50"
										>
											{savingName ? 'Сохраняем…' : 'Сохранить'}
										</button>
										<button
											type="button"
											onclick={() => (editingName = false)}
											class="min-h-11 rounded-md px-4 text-control text-gray-700 hover:bg-gray-100"
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
									class="ml-2 inline-flex min-h-11 items-center text-sm text-gray-600 underline-offset-4 hover:text-ink hover:underline"
								>
									Изменить
								</button>
							{/if}
						</dd>
					</div>
					<div>
						<dt class="text-body-sm text-gray-500">Email</dt>
						<dd class="mt-0.5 text-body text-ink">{$authStore.user.email}</dd>
					</div>
					{#if roleLabel}
						<div>
							<dt class="text-body-sm text-gray-500">Роль</dt>
							<dd class="mt-0.5 text-body text-ink">{roleLabel}</dd>
						</div>
					{/if}
				</dl>
			</div>

			<!-- Пароль -->
			<div class="border-t pt-6">
				<h2 class="text-title text-ink mb-2">Пароль</h2>
				{#if changingPassword}
					<ChangePasswordForm onDone={() => (changingPassword = false)} />
				{:else}
					<p class="mb-4 text-sm text-gray-600">После смены пароля на других устройствах нужно будет войти заново.</p>
					<button
						type="button"
						onclick={() => (changingPassword = true)}
						class="min-h-11 rounded-md border border-gray-300 px-4 text-control transition-colors hover:bg-gray-50"
					>
						Сменить пароль
					</button>
				{/if}
			</div>

			<!-- Удаление аккаунта -->
			<div class="border-t pt-6">
				<h2 class="text-title text-ink mb-2">Удаление аккаунта</h2>
				<p class="mb-4 text-sm text-gray-600">Аккаунт удалится безвозвратно, восстановить его не получится.</p>
				
				{#if !showDeleteConfirm}
					<button
						onclick={() => showDeleteConfirm = true}
						class="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
					>
						Удалить аккаунт
					</button>
				{:else}
					<div class="space-y-4">
						<p class="text-sm text-gray-600">
							Чтобы подтвердить удаление, введите пароль от аккаунта.
						</p>
						
						{#if deleteError}
							<div role="alert" class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
								{deleteError}
							</div>
						{/if}

						<div>
							<label for="delete-password" class="block text-sm font-medium text-gray-700 mb-1">
								Пароль
							</label>
							<input
								id="delete-password"
								type="password"
								bind:value={deletePassword}
								autocomplete="current-password"
								class="w-full md:w-64 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
							/>
						</div>

						<div class="flex space-x-2">
							<button
								onclick={handleDeleteAccount}
								disabled={isDeleting}
								class="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors disabled:opacity-50"
							>
								{isDeleting ? 'Удаляем аккаунт…' : 'Удалить аккаунт навсегда'}
							</button>
							<button
								onclick={() => {
									showDeleteConfirm = false;
									deletePassword = '';
									deleteError = null;
								}}
								class="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors text-control"
							>
								Отмена
							</button>
						</div>
					</div>
				{/if}
			</div>
		</div>
	{/if}
</div>
