<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { authStore, hasRole } from '$lib/stores/auth';
	import { cartItemsCount } from '$lib/stores/cart';
	import { storeSettings } from '$lib/stores/store';
	import AuthModal from '$lib/components/auth/AuthModal.svelte';
	import CartBadge from './CartBadge.svelte';
	import LayoutGrid from '@lucide/svelte/icons/layout-grid';
	import Search from '@lucide/svelte/icons/search';
	import User from '@lucide/svelte/icons/user';
	import Heart from '@lucide/svelte/icons/heart';
	import ShoppingCart from '@lucide/svelte/icons/shopping-cart';
	import Phone from '@lucide/svelte/icons/phone';

	let showAuthModal = $state(false);
	let authMode: 'login' | 'register' = $state('login');

	const storeName = $derived($storeSettings?.name || 'Магазин');
	const phone = $derived($storeSettings?.contactPhone ?? null);
	const cartLabel = $derived($cartItemsCount > 0 ? `Корзина, товаров: ${$cartItemsCount}` : 'Корзина');
	const canAdmin = $derived($authStore.isAuthenticated && $hasRole(['admin', 'manager']));
	const searchQuery = $derived(page.url.pathname === '/search' ? (page.url.searchParams.get('q') ?? '') : '');

	// Куда вернуть пользователя после входа. Принимаем только относительные пути внутри сайта
	const redirectTarget = $derived(sanitizeRedirect(page.url.searchParams.get('redirect')));

	function sanitizeRedirect(value: string | null): string | null {
		if (!value) return null;
		return /^\/(?!\/)/.test(value) ? value : null;
	}

	function isActive(prefix: string): boolean {
		return page.url.pathname.startsWith(prefix);
	}

	// Зачем просим войти: покупатель видит причину над формой, а не просто окно логина
	let authReason = $state<string | null>(null);

	function openLogin(reason: string | null = null) {
		authReason = reason;
		authMode = 'login';
		showAuthModal = true;
	}

	function reasonForRedirect(target: string): string {
		if (target.startsWith('/checkout')) {
			return 'Чтобы оформить заказ, войдите или зарегистрируйтесь. Товары в корзине сохранятся.';
		}
		if (target.startsWith('/account/wishlist')) return 'Войдите, чтобы открыть избранное.';
		if (target.startsWith('/account')) return 'Войдите, чтобы открыть личный кабинет.';
		if (target.startsWith('/admin')) return 'Войдите под учётной записью сотрудника магазина.';
		return 'Войдите, чтобы продолжить.';
	}

	// Избранное и кабинет требуют входа: гостю сразу предлагаем войти, а не отправляем на пустую страницу
	function requireAuth(event: MouseEvent) {
		if (!$authStore.isAuthenticated) {
			event.preventDefault();
			openLogin('Войдите, чтобы сохранять товары в избранное и видеть их с любого устройства.');
		}
	}

	// Пришли с защищённой страницы: открываем окно входа, как только точно знаем, что пользователь не авторизован
	$effect(() => {
		if (redirectTarget && !$authStore.isLoading && !$authStore.isAuthenticated) {
			openLogin(reasonForRedirect(redirectTarget));
		}
	});

	$effect(() => {
		const handleOpen = (event: Event) => openLogin((event as CustomEvent<{ reason?: string }>).detail?.reason ?? null);
		const handleSuccess = () => {
			if (redirectTarget) goto(redirectTarget);
		};
		window.addEventListener('open-auth-modal', handleOpen);
		window.addEventListener('auth:success', handleSuccess);
		return () => {
			window.removeEventListener('open-auth-modal', handleOpen);
			window.removeEventListener('auth:success', handleSuccess);
		};
	});

	function preventEmptySearch(event: SubmitEvent) {
		const form = event.currentTarget as HTMLFormElement;
		const field = form.querySelector('input');
		if (!field?.value.trim()) event.preventDefault();
	}

	const actionClass =
		'relative inline-flex min-h-11 min-w-14 flex-col items-center justify-center gap-0.5 rounded-xl px-2 text-xs text-gray-600 transition-colors hover:text-ink';
</script>

{#snippet searchForm(id: string)}
	<form action="/search" method="get" role="search" class="relative w-full" onsubmit={preventEmptySearch}>
		<label for={id} class="sr-only">Поиск товаров</label>
		<input
			{id}
			type="search"
			name="q"
			value={searchQuery}
			placeholder="Поиск товаров"
			enterkeyhint="search"
			autocomplete="off"
			class="h-11 w-full rounded-xl border-0 bg-gray-100 pr-12 pl-4 text-[0.9375rem] text-ink placeholder:text-gray-500 focus:bg-white focus:ring-2 focus:ring-ink focus:outline-none"
		/>
		<button
			type="submit"
			aria-label="Найти"
			class="absolute top-0 right-0 inline-flex size-11 items-center justify-center rounded-xl text-gray-500 hover:text-ink"
		>
			<Search class="size-5" aria-hidden="true" />
		</button>
	</form>
{/snippet}

<header class="bg-surface">
	<!-- Служебная строка (десктоп) -->
	<div class="hidden border-b border-line md:block">
		<div class="container flex h-9 items-center justify-between gap-4 text-sm text-gray-500">
			<div class="flex items-center gap-5">
				{#if phone}
					<a href="tel:{phone.replace(/[^\d+]/g, '')}" class="inline-flex items-center gap-1.5 hover:text-ink">
						<Phone class="size-3.5" aria-hidden="true" />
						{phone}
					</a>
				{/if}
				<a href="/contacts" class="hover:text-ink" aria-current={isActive('/contacts') ? 'page' : undefined}>
					Контакты и самовывоз
				</a>
			</div>
			{#if canAdmin}
				<a href="/admin" class="hover:text-ink" aria-current={isActive('/admin') ? 'page' : undefined}>Админ-панель</a>
			{/if}
		</div>
	</div>

	<div class="container py-3 md:py-4">
		<div class="flex items-center gap-3 md:gap-4">
			<a href="/" class="inline-flex min-h-11 shrink-0 items-center" aria-label="{storeName}, на главную">
				{#if $storeSettings?.logoUrl}
					<img src={$storeSettings.logoUrl} alt="" class="h-8 w-auto max-w-40 object-contain" />
				{:else}
					<span class="max-w-[12rem] truncate text-xl font-semibold tracking-tight text-ink">{storeName}</span>
				{/if}
			</a>

			<a
				href="/catalog"
				class="hidden h-11 shrink-0 items-center gap-2 rounded-xl bg-ink px-4 text-sm font-medium text-white transition-colors hover:bg-ink-hover md:inline-flex"
				aria-current={isActive('/catalog') ? 'page' : undefined}
			>
				<LayoutGrid class="size-4.5" aria-hidden="true" />
				Каталог
			</a>

			<div class="hidden flex-1 md:block">
				{@render searchForm('header-search')}
			</div>

			<nav class="ml-auto hidden items-center gap-1 md:flex" aria-label="Покупки">
				{#if $authStore.isAuthenticated}
					<a href="/account" class={actionClass} aria-current={isActive('/account') ? 'page' : undefined}>
						<User class="size-5.5" aria-hidden="true" />
						<span class="max-w-20 truncate">{$authStore.user?.username ?? 'Профиль'}</span>
					</a>
				{:else}
					<button type="button" onclick={() => openLogin()} class={actionClass}>
						<User class="size-5.5" aria-hidden="true" />
						Войти
					</button>
				{/if}
				<a href="/account/wishlist" onclick={requireAuth} class={actionClass}>
					<Heart class="size-5.5" aria-hidden="true" />
					Избранное
				</a>
				<a href="/cart" class={actionClass} aria-label={cartLabel} aria-current={isActive('/cart') ? 'page' : undefined}>
					<ShoppingCart class="size-5.5" aria-hidden="true" />
					<span aria-hidden="true">Корзина</span>
					<CartBadge class="absolute top-0 right-2" />
				</a>
			</nav>
		</div>

		<!-- Поиск (мобильный) -->
		<div class="mt-2.5 md:hidden">
			{@render searchForm('mobile-search')}
		</div>
	</div>
</header>

<!-- На телефоне навигацию несут нижние вкладки: отдельного меню в шапке нет -->

<AuthModal bind:open={showAuthModal} bind:mode={authMode} reason={authReason} />
