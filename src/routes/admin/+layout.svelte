<script lang="ts">
	import { page } from '$app/state';
	import { authStore, hasRole, isAdminOrManager } from '$lib/stores/auth';
	import { unreadNewOrders } from '$lib/stores/notifications';
	import type { Role } from '$lib/types/auth';
	import type { Component } from 'svelte';
	import ChartColumn from '@lucide/svelte/icons/chart-column';
	import Package from '@lucide/svelte/icons/package';
	import FolderTree from '@lucide/svelte/icons/folder-tree';
	import ShoppingCart from '@lucide/svelte/icons/shopping-cart';
	import TicketPercent from '@lucide/svelte/icons/ticket-percent';
	import MapPin from '@lucide/svelte/icons/map-pin';
	import Settings from '@lucide/svelte/icons/settings';
	import CategoryChips from '$lib/components/catalog/CategoryChips.svelte';

	let { children } = $props();

	// Гостя и покупателя не пускает сервер (+layout.server.ts), до отрисовки админки

	const menuItems: { href: string; label: string; icon: Component; roles: Role[] }[] = [
		{ href: '/admin', label: 'Обзор', icon: ChartColumn, roles: ['manager', 'admin'] },
		{ href: '/admin/products', label: 'Товары', icon: Package, roles: ['manager', 'admin'] },
		{ href: '/admin/categories', label: 'Категории', icon: FolderTree, roles: ['manager', 'admin'] },
		{ href: '/admin/orders', label: 'Заказы', icon: ShoppingCart, roles: ['manager', 'admin'] },
		{ href: '/admin/coupons', label: 'Купоны', icon: TicketPercent, roles: ['manager', 'admin'] },
		{ href: '/admin/locations', label: 'Точки продаж', icon: MapPin, roles: ['manager', 'admin'] },
		{ href: '/admin/store', label: 'Настройки магазина', icon: Settings, roles: ['admin'] }
	];

	// Обзор живёт на корне админки, поэтому ему подходит только точное совпадение
	function isCurrent(href: string): boolean {
		return href === '/admin' ? page.url.pathname === '/admin' : page.url.pathname.startsWith(href);
	}
</script>

{#if $authStore.isAuthenticated && $isAdminOrManager}
	<div class="container py-4 md:py-6">
		<!-- Телефон: разделы строкой чипсов; админка рассчитана на десктоп, но не ломается на телефоне -->
		<div class="mb-3 lg:hidden">
			<CategoryChips
				label="Разделы админ-панели"
				chips={menuItems
					.filter((item) => $hasRole(item.roles))
					.map((item) => ({ label: item.label, href: item.href, active: isCurrent(item.href) }))}
			/>
		</div>

		<div class="lg:grid lg:grid-cols-[16rem_minmax(0,1fr)] lg:items-start lg:gap-6">
			<!-- Десктоп: боковое меню -->
			<aside class="hidden lg:sticky lg:top-4 lg:block">
				<div class="rounded-2xl bg-surface p-5">
					<p class="text-title text-ink mb-4">Админ-панель</p>
					<nav class="space-y-1" aria-label="Разделы админ-панели">
						{#each menuItems as item (item.href)}
							{#if $hasRole(item.roles)}
								<a
									href={item.href}
									class="flex min-h-11 items-center gap-2.5 rounded-xl px-3 text-control transition-colors {isCurrent(item.href)
										? 'bg-gray-100 text-ink'
										: 'text-gray-700 hover:bg-gray-50 hover:text-ink'}"
									aria-current={isCurrent(item.href) ? 'page' : undefined}
								>
									<item.icon class="size-4.5 shrink-0" aria-hidden="true" />
									<span class="flex-1">{item.label}</span>
									<!-- Новые заказы, о которых пришли уведомления: видно из любого раздела админки -->
									{#if item.href === '/admin/orders' && $unreadNewOrders > 0}
										<span class="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-ink px-1.5 text-tab leading-none font-semibold text-white tabular-nums">
											{$unreadNewOrders}<span class="sr-only"> новых</span>
										</span>
									{/if}
								</a>
							{/if}
						{/each}
					</nav>
				</div>
			</aside>

			<!-- Основной контент -->
			<div class="min-w-0">
				{@render children()}
			</div>
		</div>
	</div>
{:else}
	<div class="container py-12 text-center">
		<p class="mb-4 text-body text-gray-600">Доступ запрещён</p>
		<a href="/" class="link">Вернуться на главную</a>
	</div>
{/if}
