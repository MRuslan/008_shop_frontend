<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { authStore } from '$lib/stores/auth';
	import { page } from '$app/stores';

	onMount(() => {
		// Проверка авторизации
		if (!$authStore.isAuthenticated) {
			goto('/?redirect=/account');
		}
	});

	const menuItems = [
		{ href: '/account', label: 'Профиль', icon: '👤' },
		{ href: '/account/orders', label: 'Мои заказы', icon: '📦' },
		{ href: '/account/addresses', label: 'Адреса', icon: '📍' },
		{ href: '/account/wishlist', label: 'Избранное', icon: '❤️' }
	];
</script>

{#if $authStore.isAuthenticated}
	<div class="container mx-auto px-4 py-8">
		<div class="grid grid-cols-1 lg:grid-cols-4 gap-6">
			<!-- Боковое меню -->
			<aside class="lg:col-span-1">
				<nav class="bg-white rounded-lg shadow-md p-4">
					<h2 class="text-lg font-semibold text-gray-800 mb-4">Личный кабинет</h2>
					<ul class="space-y-2">
						{#each menuItems as item}
							<li>
								<a
									href={item.href}
									class="flex items-center space-x-2 px-4 py-2 rounded-md transition-colors"
									class:bg-blue-100={$page.url.pathname === item.href}
									class:text-blue-600={$page.url.pathname === item.href}
									class:hover:bg-gray-100={$page.url.pathname !== item.href}
									class:text-gray-700={$page.url.pathname !== item.href}
								>
									<span>{item.icon}</span>
									<span>{item.label}</span>
								</a>
							</li>
						{/each}
					</ul>
				</nav>
			</aside>

			<!-- Основной контент -->
			<main class="lg:col-span-3">
				<slot />
			</main>
		</div>
	</div>
{:else}
	<div class="container mx-auto px-4 py-8 text-center">
		<p class="text-gray-500 mb-4">Необходима авторизация</p>
		<a href="/" class="text-blue-600 hover:text-blue-800">Вернуться на главную</a>
	</div>
{/if}
