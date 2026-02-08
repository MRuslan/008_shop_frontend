<script lang="ts">
	import { onMount } from 'svelte';
	import { authStore } from '$lib/stores/auth';
	import { authApi } from '$lib/api/auth';
	import { goto } from '$app/navigation';

	let isDeleting = $state(false);
	let showDeleteConfirm = $state(false);
	let deletePassword = $state('');
	let deleteError = $state<string | null>(null);

	async function handleDeleteAccount() {
		if (!deletePassword.trim()) {
			deleteError = 'Введите пароль для подтверждения';
			return;
		}

		isDeleting = true;
		deleteError = null;

		try {
			await authApi.deleteAccount({ password: deletePassword });
			await authStore.logout();
			goto('/');
		} catch (err: any) {
			deleteError = err.message || 'Ошибка удаления аккаунта';
		} finally {
			isDeleting = false;
		}
	}
</script>

<svelte:head>
	<title>Профиль - Личный кабинет</title>
	<meta name="description" content="Профиль пользователя" />
</svelte:head>

<div class="bg-white rounded-lg shadow-md p-6">
	<h1 class="text-2xl font-bold text-gray-800 mb-6">Профиль</h1>

	{#if $authStore.user}
		<div class="space-y-6">
			<!-- Информация о пользователе -->
			<div>
				<h2 class="text-lg font-semibold text-gray-800 mb-4">Личная информация</h2>
				<dl class="grid grid-cols-1 md:grid-cols-2 gap-4">
					<div>
						<dt class="text-sm font-medium text-gray-500">Имя пользователя</dt>
						<dd class="mt-1 text-sm text-gray-900">{$authStore.user.username}</dd>
					</div>
					<div>
						<dt class="text-sm font-medium text-gray-500">Email</dt>
						<dd class="mt-1 text-sm text-gray-900">{$authStore.user.email}</dd>
					</div>
					<div>
						<dt class="text-sm font-medium text-gray-500">Роль</dt>
						<dd class="mt-1 text-sm text-gray-900">
							<span class="inline-block px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-medium">
								{$authStore.user.role}
							</span>
						</dd>
					</div>
				</dl>
			</div>

			<!-- Удаление аккаунта -->
			<div class="border-t pt-6">
				<h2 class="text-lg font-semibold text-red-600 mb-4">Опасная зона</h2>
				
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
							Введите пароль для подтверждения удаления аккаунта. Это действие нельзя отменить.
						</p>
						
						{#if deleteError}
							<div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
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
								placeholder="Введите пароль"
								class="w-full md:w-64 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
							/>
						</div>

						<div class="flex space-x-2">
							<button
								onclick={handleDeleteAccount}
								disabled={isDeleting}
								class="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors disabled:opacity-50"
							>
								{isDeleting ? 'Удаление...' : 'Подтвердить удаление'}
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
