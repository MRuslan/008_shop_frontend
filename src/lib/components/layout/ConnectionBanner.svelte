<script lang="ts">
	import { connectivity } from '$lib/stores/connectivity';
	import WifiOff from '@lucide/svelte/icons/wifi-off';
	import CloudOff from '@lucide/svelte/icons/cloud-off';
</script>

<!-- Полоса над шапкой, пока нет связи: видна при прокрутке и не закрывает содержимое.
     Пустая область role="status" остаётся в DOM, чтобы скринридер прочитал появление текста -->
<div role="status" class="sticky top-0 z-40">
	{#if $connectivity !== 'online'}
		<div class="border-b border-caution/20 bg-[color-mix(in_oklab,var(--color-caution)_10%,var(--color-surface))]">
			<div class="container flex min-h-11 items-center gap-3 py-1.5 text-body-sm text-gray-900">
				{#if $connectivity === 'offline'}
					<WifiOff class="size-4.5 shrink-0 text-caution" aria-hidden="true" />
					<p class="min-w-0 flex-1">Нет подключения к интернету. Проверьте сеть и повторите действие.</p>
				{:else}
					<CloudOff class="size-4.5 shrink-0 text-caution" aria-hidden="true" />
					<p class="min-w-0 flex-1">Сервер магазина не отвечает. Проверяем связь каждые 10 секунд.</p>
					<button type="button" onclick={() => connectivity.retry()} class="btn-text shrink-0 text-body-sm">
						Повторить
					</button>
				{/if}
			</div>
		</div>
	{/if}
</div>
