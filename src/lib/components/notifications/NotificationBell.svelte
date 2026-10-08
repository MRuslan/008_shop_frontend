<script lang="ts">
	import { notifications } from '$lib/stores/notifications';
	import NotificationList from './NotificationList.svelte';
	import Bell from '@lucide/svelte/icons/bell';

	interface Props {
		/** Классы кнопки — те же, что у соседних действий шапки */
		buttonClass: string;
	}

	let { buttonClass }: Props = $props();

	const PANEL_ITEMS = 8;

	let button: HTMLButtonElement | undefined = $state();
	let panel: HTMLDivElement | undefined = $state();

	const unread = $derived($notifications.unread);
	const label = $derived(unread > 0 ? `Уведомления, непрочитанных: ${unread}` : 'Уведомления');

	// Панель живёт в верхнем слое (Popover API): закрывается по Esc и щелчку мимо сама.
	// Ставим её под кнопкой, правым краем к правому краю кнопки — до показа, чтобы не мелькнула по центру
	function place(event: Event) {
		if ((event as ToggleEvent).newState !== 'open' || !button || !panel) return;
		const rect = button.getBoundingClientRect();
		panel.style.top = `${rect.bottom + 8}px`;
		// clientWidth без полосы прокрутки: от её края и отсчитывается right у fixed-элемента
		panel.style.right = `${Math.max(16, document.documentElement.clientWidth - rect.right)}px`;
	}

	function close() {
		panel?.hidePopover();
	}
</script>

<button
	bind:this={button}
	type="button"
	popovertarget="notifications-panel"
	aria-label={label}
	class={buttonClass}
>
	<!-- Счётчик у угла значка, как у корзины: подпись под ним остаётся читаемой -->
	<span class="relative">
		<Bell class="size-5.5" aria-hidden="true" />
		{#if unread > 0}
			<span
				class="pointer-events-none absolute -top-1.5 -right-3 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-ink px-1 text-tab leading-none font-semibold text-white tabular-nums ring-2 ring-surface"
				aria-hidden="true"
			>
				{unread > 99 ? '99+' : unread}
			</span>
		{/if}
	</span>
	<span aria-hidden="true">Уведомления</span>
</button>

<div
	bind:this={panel}
	id="notifications-panel"
	popover
	onbeforetoggle={place}
	aria-label="Уведомления"
	class="fixed inset-auto m-0 max-h-[min(32rem,calc(100dvh-8rem))] w-[min(24rem,calc(100vw-2rem))] overflow-y-auto rounded-2xl border-0 bg-surface p-2 text-gray-900 shadow-[0_8px_24px_rgb(0_0_0/0.18)]"
>
	<div class="flex items-center justify-between gap-3 px-3 pt-2 pb-1">
		<p class="text-title-sm text-ink">Уведомления</p>
		{#if unread > 0}
			<button type="button" onclick={() => notifications.markAllRead()} class="btn-text text-body-sm">
				Прочитать все
			</button>
		{/if}
	</div>

	{#if !$notifications.available}
		<p class="px-3 py-6 text-center text-body-sm text-gray-600">Уведомления пока недоступны.</p>
	{:else if !$notifications.loaded}
		<p class="px-3 py-6 text-center text-body-sm text-gray-600" role="status">Загружаем…</p>
	{:else if $notifications.items.length === 0}
		<p class="px-3 py-6 text-center text-body-sm text-gray-600">
			Пока ничего нового. Здесь появятся статусы заказов и важные события магазина.
		</p>
	{:else}
		<NotificationList items={$notifications.items.slice(0, PANEL_ITEMS)} onNavigate={close} />
	{/if}

	<div class="mt-1 border-t border-line px-1 pt-1">
		<a href="/account/notifications" onclick={close} class="flex min-h-11 items-center justify-center rounded-xl text-control text-gray-700 transition-colors hover:bg-gray-50 hover:text-ink">
			Все уведомления
		</a>
	</div>
</div>
