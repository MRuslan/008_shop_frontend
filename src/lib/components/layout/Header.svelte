<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { authStore, hasRole } from '$lib/stores/auth';
	import { cartItemsCount } from '$lib/stores/cart';
	import { storeSettings } from '$lib/stores/store';
	import AuthModal from '$lib/components/auth/AuthModal.svelte';

	let showAuthModal = $state(false);
	let authMode: 'login' | 'register' = $state('login');

	const storeName = $derived($storeSettings?.name || 'Магазин');
	const cartLabel = $derived(
		$cartItemsCount > 0 ? `Корзина, товаров: ${$cartItemsCount}` : 'Корзина'
	);

	// Куда вернуть пользователя после входа. Принимаем только относительные пути внутри сайта
	const redirectTarget = $derived(sanitizeRedirect(page.url.searchParams.get('redirect')));

	function sanitizeRedirect(value: string | null): string | null {
		if (!value) return null;
		return /^\/(?!\/)/.test(value) ? value : null;
	}

	function isActive(prefix: string): boolean {
		return page.url.pathname.startsWith(prefix);
	}

	function openLogin() {
		authMode = 'login';
		showAuthModal = true;
	}

	function openRegister() {
		authMode = 'register';
		showAuthModal = true;
	}

	async function handleLogout() {
		await authStore.logout();
	}

	// Пришли с защищённой страницы: открываем окно входа, как только точно знаем, что пользователь не авторизован
	$effect(() => {
		if (redirectTarget && !$authStore.isLoading && !$authStore.isAuthenticated) {
			openLogin();
		}
	});

	$effect(() => {
		const handleOpen = () => openLogin();
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
		const input = event.currentTarget as HTMLFormElement;
		const field = input.querySelector('input');
		if (!field?.value.trim()) event.preventDefault();
	}
</script>

<header class="bg-white shadow-md">
	<div class="container mx-auto px-4 py-4">
		<!-- Поиск (мобильный) -->
		<div class="md:hidden mb-4">
			<form action="/search" method="get" role="search" onsubmit={preventEmptySearch}>
				<input
					type="search"
					name="q"
					placeholder="Поиск товаров..."
					aria-label="Поиск товаров"
					enterkeyhint="search"
					class="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
				/>
			</form>
		</div>

		<div class="flex items-center justify-between">
			<!-- Логотип -->
			<div class="flex items-center">
				<a href="/" class="text-2xl font-bold text-gray-800">
					{storeName}
				</a>
			</div>

			<!-- Поиск (десктоп) -->
			<div class="hidden md:flex flex-1 max-w-md mx-4">
				<form
					action="/search"
					method="get"
					role="search"
					class="w-full"
					onsubmit={preventEmptySearch}
				>
					<input
						type="search"
						name="q"
						placeholder="Поиск товаров..."
						aria-label="Поиск товаров"
						enterkeyhint="search"
						class="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
					/>
				</form>
			</div>

			<!-- Навигация -->
			<nav class="hidden md:flex items-center space-x-6" aria-label="Основная навигация">
				<a
					href="/catalog"
					class="text-gray-700 hover:text-gray-900 transition-colors"
					class:font-semibold={isActive('/catalog')}
					aria-current={isActive('/catalog') ? 'page' : undefined}
				>
					Каталог
				</a>
				{#if $authStore.isAuthenticated}
					<a
						href="/account"
						class="text-gray-700 hover:text-gray-900 transition-colors"
						class:font-semibold={isActive('/account')}
						aria-current={isActive('/account') ? 'page' : undefined}
					>
						Личный кабинет
					</a>
					{#if $hasRole(['admin', 'manager'])}
						<a
							href="/admin"
							class="text-gray-700 hover:text-gray-900 transition-colors"
							class:font-semibold={isActive('/admin')}
							aria-current={isActive('/admin') ? 'page' : undefined}
						>
							Админ-панель
						</a>
					{/if}
				{/if}
			</nav>

			<!-- Действия -->
			<div class="flex items-center space-x-4">
				<!-- Корзина -->
				<a href="/cart" class="relative" aria-label={cartLabel}>
					<svg
						class="w-6 h-6 text-gray-700"
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
						aria-hidden="true"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L6 4H4M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
						/>
					</svg>
					{#if $cartItemsCount > 0}
						<span
							class="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center"
							aria-hidden="true"
						>
							{$cartItemsCount}
						</span>
					{/if}
				</a>

				<!-- Авторизация -->
				{#if $authStore.isAuthenticated}
					<div class="flex items-center space-x-2">
						<span class="text-sm text-gray-700">{$authStore.user?.username}</span>
						<button
							type="button"
							onclick={handleLogout}
							class="px-4 py-2 text-sm text-gray-700 hover:text-gray-900 transition-colors"
						>
							Выход
						</button>
					</div>
				{:else}
					<div class="flex items-center space-x-2">
						<button
							type="button"
							onclick={openLogin}
							class="px-4 py-2 text-sm text-gray-700 hover:text-gray-900 transition-colors"
						>
							Вход
						</button>
						<button
							type="button"
							onclick={openRegister}
							class="px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
						>
							Регистрация
						</button>
					</div>
				{/if}
			</div>
		</div>
	</div>
</header>

<AuthModal bind:open={showAuthModal} bind:mode={authMode} />
