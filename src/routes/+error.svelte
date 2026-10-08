<script lang="ts">
	import { page } from '$app/state';
	import { invalidateAll } from '$app/navigation';

	const status = $derived(page.status);

	const title = $derived.by(() => {
		switch (status) {
			case 404:
				return 'Страница не найдена';
			case 401:
				return 'Нужно войти в аккаунт';
			case 403:
				return 'Доступ запрещён';
			case 503:
				return 'Сервис временно недоступен';
			default:
				return 'Что-то пошло не так';
		}
	});

	// Служебные тексты SvelteKit заменяем на человеческие
	const genericMessages = new Set(['Not Found', 'Internal Error', 'Forbidden', 'Unauthorized']);

	const description = $derived.by(() => {
		const message = page.error?.message;
		if (message && !genericMessages.has(message)) return message;
		if (status === 404) return 'Возможно, ссылка устарела или товар сняли с продажи.';
		if (status >= 500) return 'Сервер не ответил. Обновите страницу через минуту.';
		return 'Вернитесь на главную и повторите действие.';
	});

	let retrying = $state(false);

	async function retry() {
		retrying = true;
		try {
			await invalidateAll();
		} finally {
			retrying = false;
		}
	}
</script>

<svelte:head>
	<title>{title}</title>
	<meta name="robots" content="noindex" />
</svelte:head>

<section class="container py-16 sm:py-24">
	<div class="mx-auto max-w-lg text-center">
		<h1 class="text-headline md:text-headline-lg text-balance text-ink">{title}</h1>
		<p class="mt-3 text-pretty text-gray-600">{description}</p>

		<div class="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
			{#if status >= 500}
				<button
					type="button"
					onclick={retry}
					disabled={retrying}
					class="btn-primary btn-lg"
				>
					{retrying ? 'Обновляем…' : 'Попробовать снова'}
				</button>
			{/if}
			<a
				href="/catalog"
				class="btn-lg {status >= 500 ? 'btn-secondary' : 'btn-primary'}"
			>
				Перейти в каталог
			</a>
			<a
				href="/"
				class="btn-secondary btn-lg"
			>
				На главную
			</a>
		</div>

		<p class="mt-10 text-label text-gray-500">Код ошибки: {status}</p>
	</div>
</section>
