<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { authStore } from '$lib/stores/auth';

	let { children } = $props();

	// Редирект только после завершения инициализации авторизации, иначе перезагрузка выбрасывает залогиненного
	$effect(() => {
		if (!$authStore.isLoading && !$authStore.isAuthenticated) {
			goto('/?redirect=/account');
		}
	});

	const menuItems = [
		{ href: '/account', label: 'Профиль', icon: '👤' },
		{ href: '/account/orders', label: 'Мои заказы', icon: '📦' },
		{ href: '/account/addresses', label: 'Адреса', icon: '📍' },
		{ href: '/account/wishlist', label: 'Избранное', icon: '❤️' }
	];

	function isCurrent(href: string): boolean {
		return page.url.pathname === href;
	}
</script>

{#if $authStore.isLoading}
	<div class="container mx-auto px-4 py-8 text-center" role="status">
		<p class="text-gray-500">Загрузка...</p>
	</div>
{:else if $authStore.isAuthenticated}
	<div class="container mx-auto px-4 py-8">
		<div class="grid grid-cols-1 lg:grid-cols-4 gap-6">
			<!-- Боковое меню -->
			<aside class="lg:col-span-1">
				<nav class="bg-white rounded-lg shadow-md p-4" aria-label="Личный кабинет">
					<h2 class="text-lg font-semibold text-gray-800 mb-4">Личный кабинет</h2>
					<ul class="space-y-2">
						{#each menuItems as item (item.href)}
							<li>
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
							</li>
						{/each}
					</ul>
				</nav>
			</aside>

			<!-- Основной контент -->
			<div class="lg:col-span-3">
				{@render children()}
			</div>
		</div>
	</div>
{:else}
	<div class="container mx-auto px-4 py-8 text-center">
		<p class="text-gray-500 mb-4">Необходима авторизация</p>
		<a href="/" class="text-blue-600 hover:text-blue-800">Вернуться на главную</a>
	</div>
{/if}
