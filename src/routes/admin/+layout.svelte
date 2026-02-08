<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { authStore, hasRole, isAdminOrManager } from '$lib/stores/auth';
	import { page } from '$app/stores';

	onMount(() => {
		// Проверка авторизации и роли
		if (!$authStore.isAuthenticated) {
			goto('/?redirect=/admin');
			return;
		}

		if (!$isAdminOrManager) {
			goto('/');
			return;
		}
	});

	const menuItems = [
		{ href: '/admin/products', label: 'Товары', icon: '📦', roles: ['manager', 'admin'] },
		{ href: '/admin/categories', label: 'Категории', icon: '📁', roles: ['manager', 'admin'] },
		{ href: '/admin/orders', label: 'Заказы', icon: '🛒', roles: ['manager', 'admin'] },
		{ href: '/admin/coupons', label: 'Купоны', icon: '🎫', roles: ['manager', 'admin'] },
		{ href: '/admin/locations', label: 'Точки продаж', icon: '📍', roles: ['manager', 'admin'] },
		{ href: '/admin/store', label: 'Настройки магазина', icon: '⚙️', roles: ['admin'] }
	];
</script>

{#if $authStore.isAuthenticated && $isAdminOrManager}
	<div class="container mx-auto px-4 py-8">
		<div class="grid grid-cols-1 lg:grid-cols-4 gap-6">
			<!-- Боковое меню -->
			<aside class="lg:col-span-1">
				<div class="bg-white rounded-lg shadow-md p-4 sticky top-4">
					<h2 class="text-lg font-semibold text-gray-800 mb-4">Админ-панель</h2>
					<nav class="space-y-2">
						{#each menuItems as item}
							{#if $hasRole(item.roles)}
								<a
									href={item.href}
									class="flex items-center space-x-2 px-4 py-2 rounded-md transition-colors"
									class:bg-blue-100={$page.url.pathname.startsWith(item.href)}
									class:text-blue-600={$page.url.pathname.startsWith(item.href)}
									class:hover:bg-gray-100={!$page.url.pathname.startsWith(item.href)}
									class:text-gray-700={!$page.url.pathname.startsWith(item.href)}
								>
									<span>{item.icon}</span>
									<span>{item.label}</span>
								</a>
							{/if}
						{/each}
					</nav>
				</div>
			</aside>

			<!-- Основной контент -->
			<main class="lg:col-span-3">
				<slot />
			</main>
		</div>
	</div>
{:else}
	<div class="container mx-auto px-4 py-8 text-center">
		<p class="text-gray-500 mb-4">Доступ запрещён</p>
		<a href="/" class="text-blue-600 hover:text-blue-800">Вернуться на главную</a>
	</div>
{/if}
