<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { authStore, hasRole, isAdminOrManager } from '$lib/stores/auth';
	import type { Role } from '$lib/types/auth';

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

	const menuItems: { href: string; label: string; icon: string; roles: Role[] }[] = [
		{ href: '/admin/products', label: 'Товары', icon: '📦', roles: ['manager', 'admin'] },
		{ href: '/admin/categories', label: 'Категории', icon: '📁', roles: ['manager', 'admin'] },
		{ href: '/admin/orders', label: 'Заказы', icon: '🛒', roles: ['manager', 'admin'] },
		{ href: '/admin/coupons', label: 'Купоны', icon: '🎫', roles: ['manager', 'admin'] },
		{ href: '/admin/locations', label: 'Точки продаж', icon: '📍', roles: ['manager', 'admin'] },
		{ href: '/admin/store', label: 'Настройки магазина', icon: '⚙️', roles: ['admin'] }
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
					<h2 class="text-lg font-semibold text-gray-800 mb-4">Админ-панель</h2>
					<nav class="space-y-2" aria-label="Разделы админ-панели">
						{#each menuItems as item (item.href)}
							{#if $hasRole(item.roles)}
								<a
									href={item.href}
									class="flex items-center space-x-2 px-4 py-2 rounded-md transition-colors"
									class:bg-blue-100={isCurrent(item.href)}
									class:text-blue-800={isCurrent(item.href)}
									class:hover:bg-gray-100={!isCurrent(item.href)}
									class:text-gray-700={!isCurrent(item.href)}
									aria-current={isCurrent(item.href) ? 'page' : undefined}
								>
									<span aria-hidden="true">{item.icon}</span>
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
