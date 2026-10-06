<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { authStore, hasRole } from '$lib/stores/auth';
	import User from '@lucide/svelte/icons/user';
	import Package from '@lucide/svelte/icons/package';
	import MapPin from '@lucide/svelte/icons/map-pin';
	import Heart from '@lucide/svelte/icons/heart';
	import SideMenuSkeleton from '$lib/components/ui/SideMenuSkeleton.svelte';

	let { children } = $props();

	// Редирект только после завершения инициализации авторизации, иначе перезагрузка выбрасывает залогиненного
	$effect(() => {
		if (!$authStore.isLoading && !$authStore.isAuthenticated) {
			goto('/?redirect=/account');
		}
	});

	const menuItems = [
		{ href: '/account', label: 'Профиль', icon: User },
		{ href: '/account/orders', label: 'Мои заказы', icon: Package },
		{ href: '/account/addresses', label: 'Адреса', icon: MapPin },
		{ href: '/account/wishlist', label: 'Избранное', icon: Heart }
	];

	async function handleLogout() {
		await authStore.logout();
		goto('/');
	}

	function isCurrent(href: string): boolean {
		return page.url.pathname === href;
	}
</script>

{#if $authStore.isLoading}
	<SideMenuSkeleton items={5} />
{:else if $authStore.isAuthenticated}
	<div class="container mx-auto px-4 py-8">
		<div class="grid grid-cols-1 lg:grid-cols-4 gap-6">
			<!-- Боковое меню -->
			<aside class="lg:col-span-1">
				<nav class="bg-white rounded-lg shadow-md p-4" aria-label="Личный кабинет">
					<h2 class="text-title text-ink mb-4">Личный кабинет</h2>
					<ul class="space-y-2">
						{#each menuItems as item (item.href)}
							<li>
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
							</li>
						{/each}
						{#if $hasRole(['admin', 'manager'])}
							<li>
								<a href="/admin" class="flex min-h-11 items-center rounded-md px-4 text-gray-700 transition-colors hover:bg-gray-100">
									Админ-панель
								</a>
							</li>
						{/if}
					</ul>
					<button
						type="button"
						onclick={handleLogout}
						class="mt-4 flex min-h-11 w-full items-center rounded-md px-4 text-left text-gray-700 transition-colors hover:bg-gray-100"
					>
						Выйти
					</button>
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
