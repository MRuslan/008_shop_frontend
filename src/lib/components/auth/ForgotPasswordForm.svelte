<script lang="ts">
	import { authApi } from '$lib/api/auth';
	import { getErrorMessage, getFieldErrors } from '$lib/utils/errors';

	interface Props {
		initialEmail?: string;
		onBack: () => void;
	}

	let { initialEmail = '', onBack }: Props = $props();

	let email = $state(initialEmail);
	let error = $state<string | null>(null);
	let isLoading = $state(false);
	// Бэкенд отвечает одинаково для любого email, поэтому и мы не говорим, есть ли такой аккаунт
	let sentTo = $state<string | null>(null);

	async function handleSubmit() {
		error = null;
		const value = email.trim();
		if (!/^\S+@\S+\.\S+$/.test(value)) {
			error = 'Проверьте email: в адресе есть ошибка.';
			return;
		}

		isLoading = true;
		try {
			await authApi.forgotPassword(value);
			sentTo = value;
		} catch (err) {
			error = getFieldErrors(err).email ?? getErrorMessage(err, 'Не удалось отправить письмо. Попробуйте ещё раз.');
		} finally {
			isLoading = false;
		}
	}
</script>

{#if sentTo}
	<div class="space-y-4" role="status">
		<p class="text-body text-gray-800">
			Если аккаунт с адресом <span class="font-medium break-all">{sentTo}</span> есть, мы отправили на него письмо со
			ссылкой для нового пароля.
		</p>
		<p class="text-body-sm text-gray-600">
			Ссылка одноразовая и действует ограниченное время. Письма нет — проверьте «Спам» или запросите ещё раз.
		</p>
		<div class="flex flex-wrap gap-2">
			<button
				type="button"
				onclick={onBack}
				class="min-h-11 rounded-md bg-blue-600 px-4 text-control text-white transition-colors hover:bg-blue-700"
			>
				Вернуться ко входу
			</button>
			<button
				type="button"
				onclick={() => (sentTo = null)}
				class="min-h-11 rounded-md px-4 text-control text-gray-700 transition-colors hover:bg-gray-100"
			>
				Отправить ещё раз
			</button>
		</div>
	</div>
{:else}
	<form
		onsubmit={(e) => {
			e.preventDefault();
			handleSubmit();
		}}
		class="space-y-4"
		novalidate
	>
		<p class="text-body-sm text-gray-600">Пришлём на почту ссылку, по которой можно задать новый пароль.</p>

		<div>
			<label for="forgot-email" class="mb-1 block text-sm font-medium text-gray-700">Email</label>
			<input
				id="forgot-email"
				type="email"
				bind:value={email}
				required
				autocomplete="email"
				inputmode="email"
				disabled={isLoading}
				aria-invalid={!!error}
				aria-describedby={error ? 'forgot-email-error' : undefined}
				class="min-h-11 w-full rounded-md border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none aria-invalid:border-red-500"
			/>
			{#if error}
				<p id="forgot-email-error" class="mt-1 text-sm text-red-700">{error}</p>
			{/if}
		</div>

		<button
			type="submit"
			disabled={isLoading}
			class="min-h-11 w-full rounded-md bg-blue-600 px-4 py-2 text-control text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
		>
			{isLoading ? 'Отправляем…' : 'Получить ссылку'}
		</button>
		<button
			type="button"
			onclick={onBack}
			class="min-h-11 w-full rounded-md text-control text-gray-700 transition-colors hover:bg-gray-100"
		>
			Вернуться ко входу
		</button>
	</form>
{/if}
