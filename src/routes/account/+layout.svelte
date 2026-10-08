<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { authStore, hasRole } from '$lib/stores/auth';
	import User from '@lucide/svelte/icons/user';
	import Package from '@lucide/svelte/icons/package';
	import MapPin from '@lucide/svelte/icons/map-pin';
	import Heart from '@lucide/svelte/icons/heart';
	import Bell from '@lucide/svelte/icons/bell';
	import { notifications } from '$lib/stores/notifications';
	import LayoutDashboard from '@lucide/svelte/icons/layout-dashboard';
	import LogOut from '@lucide/svelte/icons/log-out';
	import CategoryChips from '$lib/components/catalog/CategoryChips.svelte';

	let { children } = $props();

	// Гостя отправляет на вход сервер (+layout.server.ts), до отрисовки кабинета

	const menuItems = [
		{ href: '/account', label: 'Профиль', icon: User },
		{ href: '/account/orders', label: 'Мои заказы', icon: Package },
		{ href: '/account/addresses', label: 'Адреса', icon: MapPin },
		{ href: '/account/wishlist', label: 'Избранное', icon: Heart },
		{ href: '/account/notifications', label: 'Уведомления', icon: Bell }
	];

	// Данные перечитываются вместе с переходом: шапка и корзина станут гостевыми уже на главной
	async function handleLogout() {
		await authStore.logout();
		await goto('/', { invalidateAll: true });
	}

	// Профиль — только сам /account; остальные разделы подсвечиваются и на вложенных страницах (заказ №N)
	function isCurrent(href: string): boolean {
		const path = page.url.pathname;
		return href === '/account' ? path === href : path === href || path.startsWith(`${href}/`);
	}
</script>

{#if $authStore.isAuthenticated}
	<div class="container py-4 md:py-6">
		<!-- Телефон: разделы строкой чипсов, как в каталоге; первый экран остаётся за содержимым -->
		<div class="mb-3 lg:hidden">
			<CategoryChips
				label="Разделы кабинета"
				chips={[
					...menuItems.map((item) => ({ label: item.label, href: item.href, active: isCurrent(item.href) })),
					...($hasRole(['admin', 'manager']) ? [{ label: 'Админ-панель', href: '/admin', active: false }] : [])
				]}
			/>
		</div>

		<div class="lg:grid lg:grid-cols-[16rem_minmax(0,1fr)] lg:items-start lg:gap-6">
			<!-- Десктоп: боковое меню -->
			<aside class="hidden lg:sticky lg:top-4 lg:block">
				<nav class="rounded-2xl bg-surface p-5" aria-label="Личный кабинет">
					<p class="text-title text-ink mb-4">Личный кабинет</p>
					<ul class="space-y-1">
						{#each menuItems as item (item.href)}
							<li>
								<a
									href={item.href}
									class="flex min-h-11 items-center gap-2.5 rounded-xl px-3 text-control transition-colors {isCurrent(item.href)
										? 'bg-gray-100 text-ink'
										: 'text-gray-700 hover:bg-gray-50 hover:text-ink'}"
									aria-current={isCurrent(item.href) ? 'page' : undefined}
								>
									<item.icon class="size-4.5 shrink-0" aria-hidden="true" />
									<span class="flex-1">{item.label}</span>
									{#if item.href === '/account/notifications' && $notifications.unread > 0}
										<span class="text-label font-semibold text-ink tabular-nums">
											{$notifications.unread}<span class="sr-only"> непрочитанных</span>
										</span>
									{/if}
								</a>
							</li>
						{/each}
						{#if $hasRole(['admin', 'manager'])}
							<li>
								<a href="/admin" class="flex min-h-11 items-center gap-2.5 rounded-xl px-3 text-control text-gray-700 transition-colors hover:bg-gray-50 hover:text-ink">
									<LayoutDashboard class="size-4.5 shrink-0" aria-hidden="true" />
									<span>Админ-панель</span>
								</a>
							</li>
						{/if}
					</ul>
					<div class="mt-3 border-t border-line pt-3">
						<button
							type="button"
							onclick={handleLogout}
							class="flex min-h-11 w-full items-center gap-2.5 rounded-xl px-3 text-left text-control text-gray-700 transition-colors hover:bg-gray-50 hover:text-ink"
						>
							<LogOut class="size-4.5 shrink-0" aria-hidden="true" />
							Выйти
						</button>
					</div>
				</nav>
			</aside>

			<!-- Основной контент -->
			<div class="min-w-0">
				{@render children()}
				<!-- На телефоне бокового меню нет: выход внизу страницы кабинета -->
				<div class="mt-4 flex justify-center lg:hidden">
					<button type="button" onclick={handleLogout} class="btn-text">
						<LogOut class="size-4.5" aria-hidden="true" />
						Выйти из аккаунта
					</button>
				</div>
			</div>
		</div>
	</div>
{:else}
	<div class="container py-12 text-center">
		<p class="text-gray-500 mb-4">Необходима авторизация</p>
		<a href="/" class="link">Вернуться на главную</a>
	</div>
{/if}
