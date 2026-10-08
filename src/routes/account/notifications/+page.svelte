<script lang="ts">
	import { notifications } from '$lib/stores/notifications';
	import NotificationList from '$lib/components/notifications/NotificationList.svelte';
	import Bell from '@lucide/svelte/icons/bell';

	let { data } = $props();

	// До загрузки store в браузере (и при SSR) показываем то, что пришло со страницей
	const items = $derived($notifications.loaded ? $notifications.items : (data.initial?.data ?? []));
	const unread = $derived($notifications.loaded ? $notifications.unread : (data.initial?.unread ?? 0));
	const total = $derived($notifications.loaded ? $notifications.total : (data.initial?.total ?? 0));
	const unavailable = $derived(data.state === 'unavailable' || ($notifications.loaded && !$notifications.available));

	let loadingMore = $state(false);
	let loadMoreFailed = $state(false);

	async function loadMore() {
		loadingMore = true;
		loadMoreFailed = !(await notifications.loadMore());
		loadingMore = false;
	}
</script>

<svelte:head>
	<title>Уведомления — Личный кабинет</title>
	<meta name="robots" content="noindex" />
</svelte:head>

<div class="rounded-2xl bg-surface p-5 md:p-6">
	<div class="mb-6 flex flex-wrap items-center justify-between gap-3">
		<h1 class="text-headline text-ink">Уведомления</h1>
		{#if unread > 0}
			<button type="button" onclick={() => notifications.markAllRead()} class="btn-secondary">
				Прочитать все
			</button>
		{/if}
	</div>

	{#if unavailable}
		<p class="text-body text-gray-600">Уведомления пока недоступны: магазин ещё не включил их.</p>
	{:else if data.state === 'failed' && !$notifications.loaded}
		<div role="alert" class="notice-error">Не удалось загрузить уведомления. Обновите страницу через минуту.</div>
	{:else if items.length === 0}
		<div class="py-12 text-center">
			<Bell class="mx-auto mb-4 size-12 text-gray-300" strokeWidth={1.5} aria-hidden="true" />
			<p class="text-title-sm text-ink">Пока ничего нового</p>
			<p class="mt-1 text-body-sm text-gray-600">Здесь появятся статусы ваших заказов и важные события магазина.</p>
		</div>
	{:else}
		<div class="-mx-3">
			<NotificationList {items} />
		</div>

		{#if items.length < total}
			<div class="mt-4 flex flex-col items-center gap-2">
				{#if loadMoreFailed}
					<p role="alert" class="text-body-sm text-negative">Не удалось загрузить. Попробуйте ещё раз.</p>
				{/if}
				<button type="button" onclick={loadMore} disabled={loadingMore || !$notifications.loaded} class="btn-secondary">
					{loadingMore ? 'Загружаем…' : 'Показать ещё'}
				</button>
			</div>
		{/if}
	{/if}
</div>
