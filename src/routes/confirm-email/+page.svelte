<script lang="ts">
	import { page } from '$app/state';
	import { replaceState } from '$app/navigation';
	import { authApi } from '$lib/api/auth';
	import { authStore } from '$lib/stores/auth';
	import { getErrorMessage, getFieldErrors } from '$lib/utils/errors';

	// Ссылка из письма на новый адрес: /confirm-email?token=<64 hex>. Вход не нужен,
	// её могут открыть в другом браузере или на телефоне
	const token = page.url.searchParams.get('token')?.trim() ?? '';

	let status = $state<'idle' | 'confirming' | 'done' | 'failed'>('idle');
	let confirmedEmail = $state<string | null>(null);
	let error = $state<string | null>(null);

	// Подтверждаем по кнопке, а не сразу при открытии: почтовые сканеры сами открывают ссылки
	// из писем и израсходовали бы одноразовый токен раньше владельца
	async function confirm() {
		status = 'confirming';
		error = null;
		try {
			const result = await authApi.confirmEmail(token);
			confirmedEmail = result.email;
			status = 'done';
			// Токен использован: убираем его из адресной строки и истории
			replaceState(page.url.pathname, {});
			// В этом браузере кто-то вошёл: перечитываем профиль, чтобы шапка и кабинет показали
			// актуальный адрес. Берём с сервера, а не подставляем: вошедший мог быть другим аккаунтом
			if ($authStore.isAuthenticated) {
				const me = await authApi.getMe().catch(() => null);
				if (me) authStore.patchUser(me);
			}
		} catch (err) {
			status = 'failed';
			// Токен не того формата — ссылку обрезал почтовик или её скопировали не целиком
			error = getFieldErrors(err).token
				? 'Ссылка повреждена. Откройте её из письма целиком.'
				: getErrorMessage(err, 'Не удалось подтвердить адрес. Попробуйте ещё раз.');
		}
	}

	function openLogin() {
		window.dispatchEvent(new CustomEvent('open-auth-modal', { detail: { mode: 'login' } }));
	}

	const primaryClass =
		'btn-primary w-full';
</script>

<svelte:head>
	<title>Подтверждение email</title>
	<meta name="robots" content="noindex" />
	<!-- Токен в адресе не должен уходить сторонним сайтам в заголовке Referer -->
	<meta name="referrer" content="no-referrer" />
</svelte:head>

<div class="container py-8 md:py-12">
	<div class="mx-auto max-w-md rounded-2xl bg-surface p-6">
		{#if !token}
			<h1 class="text-headline text-balance text-ink">Ссылка неполная</h1>
			<p class="mt-4 text-body text-gray-800">
				В ссылке нет кода подтверждения. Откройте ссылку из письма целиком или запросите смену email
				заново в профиле.
			</p>
			<a href="/account" class="mt-4 {primaryClass}">Открыть профиль</a>
		{:else if status === 'done'}
			<div role="status">
				<h1 class="text-headline text-balance text-ink">Email изменён</h1>
				<p class="mt-4 text-body text-gray-800">
					Теперь входите по адресу <span class="font-medium break-all">{confirmedEmail}</span>.
				</p>
				<p class="mt-2 text-body-sm text-gray-600">На прежний адрес мы отправили уведомление о смене.</p>
			</div>
			{#if $authStore.isAuthenticated}
				<a href="/account" class="mt-6 {primaryClass}">В профиль</a>
			{:else}
				<button type="button" onclick={openLogin} class="mt-6 {primaryClass}">Войти</button>
			{/if}
		{:else}
			<h1 class="text-headline text-balance text-ink">Подтвердите новый email</h1>
			<p class="mt-4 text-body text-gray-800">
				Нажмите кнопку, и адрес для входа сменится на тот, на который пришло письмо.
			</p>

			{#if status === 'failed' && error}
				<div role="alert" class="mt-4 notice-error">
					<p>{error}</p>
					<p class="mt-1 text-body-sm">Ссылка одноразовая и действует ограниченное время. Запросите смену заново в профиле.</p>
				</div>
			{/if}

			<button
				type="button"
				onclick={confirm}
				disabled={status === 'confirming'}
				aria-busy={status === 'confirming'}
				class="mt-6 {primaryClass}"
			>
				{status === 'confirming' ? 'Подтверждаем…' : 'Подтвердить'}
			</button>
			{#if status === 'failed'}
				<a
					href="/account"
					class="mt-2 inline-flex min-h-11 w-full items-center justify-center rounded-md text-control text-gray-700 transition-colors hover:bg-gray-100"
				>
					Открыть профиль
				</a>
			{/if}
		{/if}
	</div>
</div>
