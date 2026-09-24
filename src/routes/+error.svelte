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
		if (status >= 500) return 'Мы уже знаем о проблеме. Попробуйте обновить страницу через минуту.';
		return 'Попробуйте вернуться на главную и повторить действие.';
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

<section class="container mx-auto px-4 py-16 sm:py-24">
	<div class="mx-auto max-w-lg text-center">
		<h1 class="text-3xl font-bold text-gray-900 text-balance">{title}</h1>
		<p class="mt-3 text-gray-600">{description}</p>

		<div class="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
			{#if status >= 500}
				<button
					type="button"
					onclick={retry}
					disabled={retrying}
					class="rounded-md bg-blue-600 px-6 py-3 font-medium text-white transition-colors hover:bg-blue-700 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
				>
					{retrying ? 'Обновляем…' : 'Попробовать снова'}
				</button>
			{/if}
			<a
				href="/catalog"
				class="rounded-md px-6 py-3 font-medium transition-colors focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:outline-none {status >= 500
					? 'border border-gray-300 text-gray-700 hover:bg-gray-50'
					: 'bg-blue-600 text-white hover:bg-blue-700'}"
			>
				Перейти в каталог
			</a>
			<a
				href="/"
				class="rounded-md border border-gray-300 px-6 py-3 font-medium text-gray-700 transition-colors hover:bg-gray-50 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:outline-none"
			>
				На главную
			</a>
		</div>

		<p class="mt-10 text-xs text-gray-500">Код ошибки: {status}</p>
	</div>
</section>
