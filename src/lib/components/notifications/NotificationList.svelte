<script lang="ts">
	import { goto } from '$app/navigation';
	import { notifications } from '$lib/stores/notifications';
	import type { AppNotification } from '$lib/types/notification';
	import { formatDateTime, formatRelativeTime } from '$lib/utils/format';
	import Package from '@lucide/svelte/icons/package';
	import PackageX from '@lucide/svelte/icons/package-x';
	import TriangleAlert from '@lucide/svelte/icons/triangle-alert';
	import Bell from '@lucide/svelte/icons/bell';

	interface Props {
		items: AppNotification[];
		/** Вызывается после перехода по уведомлению: панель закрывается */
		onNavigate?: () => void;
	}

	let { items, onNavigate }: Props = $props();

	function iconFor(notification: AppNotification) {
		if (notification.type === 'stock.depleted') return PackageX;
		if (notification.severity === 'error' || notification.type.startsWith('system.')) return TriangleAlert;
		if (notification.type.startsWith('order.')) return Package;
		return Bell;
	}

	// Цвет значка повторяет важность; текст остаётся тёмным, чтобы читался на любом фоне
	const TONE: Record<AppNotification['severity'], string> = {
		error: 'text-negative',
		warning: 'text-caution',
		success: 'text-positive',
		info: 'text-gray-500'
	};

	const ROW = 'flex w-full min-h-11 items-start gap-3 rounded-xl px-3 py-2.5 text-left transition-colors hover:bg-gray-50';

	async function open(notification: AppNotification, event: MouseEvent) {
		void notifications.markRead(notification.id);
		if (!notification.link) return;
		event.preventDefault();
		onNavigate?.();
		await goto(notification.link);
	}
</script>

{#snippet content(notification: AppNotification)}
	{@const Icon = iconFor(notification)}
	{@const unread = !notification.readAt}
	<Icon class="mt-0.5 size-5 shrink-0 {TONE[notification.severity]}" aria-hidden="true" />
	<span class="min-w-0 flex-1">
		<span class="block text-body-sm break-words {unread ? 'font-medium text-ink' : 'text-gray-700'}">
			{notification.title}
		</span>
		{#if notification.body}
			<span class="mt-0.5 block text-body-sm break-words text-gray-600">{notification.body}</span>
		{/if}
		<time datetime={notification.createAt} title={formatDateTime(notification.createAt)} class="mt-1 block text-label text-gray-500">
			{formatRelativeTime(notification.createAt)}
		</time>
	</span>
	{#if unread}
		<span class="mt-1.5 size-2 shrink-0 rounded-full bg-ink" aria-hidden="true"></span>
		<span class="sr-only">, не прочитано</span>
	{/if}
{/snippet}

<ul class="flex flex-col gap-0.5">
	{#each items as notification (notification.id)}
		<li>
			{#if notification.link}
				<a href={notification.link} onclick={(event) => open(notification, event)} class={ROW}>
					{@render content(notification)}
				</a>
			{:else}
				<!-- Без ссылки строку можно только отметить прочитанной -->
				<button type="button" onclick={(event) => open(notification, event)} class={ROW}>
					{@render content(notification)}
				</button>
			{/if}
		</li>
	{/each}
</ul>
