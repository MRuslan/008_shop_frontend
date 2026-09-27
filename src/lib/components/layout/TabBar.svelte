<script lang="ts">
	import { page } from '$app/state';
	import { authStore } from '$lib/stores/auth';
	import { cartItemsCount } from '$lib/stores/cart';
	import CartBadge from './CartBadge.svelte';
	import House from '@lucide/svelte/icons/house';
	import LayoutGrid from '@lucide/svelte/icons/layout-grid';
	import ShoppingCart from '@lucide/svelte/icons/shopping-cart';
	import Heart from '@lucide/svelte/icons/heart';
	import User from '@lucide/svelte/icons/user';

	const path = $derived(page.url.pathname);

	const tabs = $derived([
		{ href: '/', label: 'Главная', icon: House, active: path === '/', auth: false },
		{
			href: '/catalog',
			label: 'Каталог',
			icon: LayoutGrid,
			active: ['/catalog', '/categories', '/products', '/search'].some((prefix) => path.startsWith(prefix)),
			auth: false
		},
		{ href: '/cart', label: 'Корзина', icon: ShoppingCart, active: path.startsWith('/cart'), auth: false },
		{ href: '/account/wishlist', label: 'Избранное', icon: Heart, active: path.startsWith('/account/wishlist'), auth: true },
		{
			href: '/account',
			label: $authStore.isAuthenticated ? 'Профиль' : 'Войти',
			icon: User,
			active: path.startsWith('/account') && !path.startsWith('/account/wishlist'),
			auth: true
		}
	]);

	// Гостю вкладки кабинета открывают окно входа, а не пустую страницу
	function handleClick(event: MouseEvent, needsAuth: boolean, href: string) {
		if (needsAuth && !$authStore.isAuthenticated) {
			event.preventDefault();
			const reason =
				href === '/account/wishlist'
					? 'Войдите, чтобы сохранять товары в избранное и видеть их с любого устройства.'
					: 'Войдите или зарегистрируйтесь: в кабинете ваши заказы, адреса и избранное.';
			window.dispatchEvent(new CustomEvent('open-auth-modal', { detail: { reason } }));
		}
	}
</script>

<nav
	aria-label="Разделы магазина"
	class="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-surface pb-[env(safe-area-inset-bottom)] md:hidden"
>
	<ul class="grid h-(--tabbar-height) grid-cols-5">
		{#each tabs as tab (tab.href)}
			<li>
				<a
					href={tab.href}
					onclick={(event) => handleClick(event, tab.auth, tab.href)}
					aria-current={tab.active ? 'page' : undefined}
					aria-label={tab.href === '/cart' && $cartItemsCount > 0 ? `Корзина, товаров: ${$cartItemsCount}` : undefined}
					class="relative flex h-full flex-col items-center justify-center gap-0.5 text-tab transition-colors {tab.active
						? 'text-ink'
						: 'text-gray-500'}"
				>
					<span class="relative">
						<tab.icon class="size-6" strokeWidth={tab.active ? 2.25 : 1.75} aria-hidden="true" />
						{#if tab.href === '/cart'}
							<CartBadge class="absolute -top-1.5 -right-3" />
						{/if}
					</span>
					<span aria-hidden={tab.href === '/cart' && $cartItemsCount > 0 ? 'true' : undefined}>{tab.label}</span>
				</a>
			</li>
		{/each}
	</ul>
</nav>
