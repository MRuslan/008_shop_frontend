<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { authStore, hasRole, isAdminOrManager } from '$lib/stores/auth';
	import type { Role } from '$lib/types/auth';
	import type { Component } from 'svelte';
	import Package from '@lucide/svelte/icons/package';
	import FolderTree from '@lucide/svelte/icons/folder-tree';
	import ShoppingCart from '@lucide/svelte/icons/shopping-cart';
	import TicketPercent from '@lucide/svelte/icons/ticket-percent';
	import MapPin from '@lucide/svelte/icons/map-pin';
	import Settings from '@lucide/svelte/icons/settings';

	let { children } = $props();

	// Редирект только после завершения инициализации авторизации, иначе перезагрузка выбрасывает залогиненного
	$effect(() => {
		if (!$authStore.isLoading) {
			if (!$authStore.isAuthenticated) {
				goto('/?redirect=/admin');
				return;
			}
			if (!$isAdminOrManager) {
				goto('/');
				return;
			}
		}
	});

	const menuItems: { href: string; label: string; icon: Component; roles: Role[] }[] = [
		{ href: '/admin/products', label: 'Товары', icon: Package, roles: ['manager', 'admin'] },
		{ href: '/admin/categories', label: 'Категории', icon: FolderTree, roles: ['manager', 'admin'] },
		{ href: '/admin/orders', label: 'Заказы', icon: ShoppingCart, roles: ['manager', 'admin'] },
		{ href: '/admin/coupons', label: 'Купоны', icon: TicketPercent, roles: ['manager', 'admin'] },
		{ href: '/admin/locations', label: 'Точки продаж', icon: MapPin, roles: ['manager', 'admin'] },
		{ href: '/admin/store', label: 'Настройки магазина', icon: Settings, roles: ['admin'] }
	];

	function isCurrent(href: string): boolean {
		return page.url.pathname.startsWith(href);
	}
</script>

{#if $authStore.isLoading}
	<div class="container mx-auto px-4 py-8 text-center" role="status">
		<p class="text-gray-500">Загрузка...</p>
	</div>
{:else if $authStore.isAuthenticated && $isAdminOrManager}
	<div class="container mx-auto px-4 py-8">
		<div class="grid grid-cols-1 lg:grid-cols-4 gap-6">
			<!-- Боковое меню -->
			<aside class="lg:col-span-1">
				<div class="bg-white rounded-lg shadow-md p-4 sticky top-4">
					<h2 class="text-title text-ink mb-4">Админ-панель</h2>
					<nav class="space-y-2" aria-label="Разделы админ-панели">
						{#each menuItems as item (item.href)}
							{#if $hasRole(item.roles)}
								<a
									href={item.href}
									class="flex min-h-11 items-center gap-2.5 px-4 py-2 rounded-md transition-colors"
									class:bg-blue-100={isCurrent(item.href)}
									class:text-blue-800={isCurrent(item.href)}
									class:hover:bg-gray-100={!isCurrent(item.href)}
									class:text-gray-700={!isCurrent(item.href)}
									aria-current={isCurrent(item.href) ? 'page' : undefined}
								>
									<item.icon class="size-4.5 shrink-0" aria-hidden="true" />
									<span>{item.label}</span>
								</a>
							{/if}
						{/each}
					</nav>
				</div>
			</aside>

			<!-- Основной контент -->
			<div class="lg:col-span-3">
				{@render children()}
			</div>
		</div>
	</div>
{:else}
	<div class="container mx-auto px-4 py-8 text-center">
		<p class="text-gray-500 mb-4">Доступ запрещён</p>
		<a href="/" class="text-blue-600 hover:text-blue-800">Вернуться на главную</a>
	</div>
{/if}
