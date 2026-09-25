<script lang="ts">
	import { onMount } from 'svelte';
	import { authStore } from '$lib/stores/auth';
	import { authApi } from '$lib/api/auth';
	import { goto } from '$app/navigation';
	import { getErrorMessage } from '$lib/utils/errors';

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
	<h1 class="text-2xl font-bold text-gray-800 mb-6">Профиль</h1>

	{#if $authStore.user}
		<div class="space-y-6">
			<!-- Информация о пользователе -->
			<div>
				<h2 class="text-lg font-semibold text-gray-800 mb-4">Данные аккаунта</h2>
				<dl class="grid grid-cols-1 md:grid-cols-2 gap-4">
					<div>
						<dt class="text-sm font-medium text-gray-500">Имя</dt>
						<dd class="mt-1 text-sm text-gray-900">{$authStore.user.username}</dd>
					</div>
					<div>
						<dt class="text-sm font-medium text-gray-500">Email</dt>
						<dd class="mt-1 text-sm text-gray-900">{$authStore.user.email}</dd>
					</div>
					{#if roleLabel}
						<div>
							<dt class="text-sm font-medium text-gray-500">Роль</dt>
							<dd class="mt-1 text-sm text-gray-900">{roleLabel}</dd>
						</div>
					{/if}
				</dl>
			</div>

			<!-- Удаление аккаунта -->
			<div class="border-t pt-6">
				<h2 class="text-lg font-semibold text-gray-800 mb-2">Удаление аккаунта</h2>
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
								class="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
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
