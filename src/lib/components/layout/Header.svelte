<script lang="ts">
	import { afterNavigate, goto } from '$app/navigation';
	import { page } from '$app/state';
	import { authStore, hasRole } from '$lib/stores/auth';
	import { cartItemsCount } from '$lib/stores/cart';
	import { storeSettings } from '$lib/stores/store';
	import AuthModal from '$lib/components/auth/AuthModal.svelte';

	let showAuthModal = $state(false);
	let authMode: 'login' | 'register' = $state('login');

	// Мобильное меню: нативный <dialog> как выезжающая панель (фокус, Escape, подложка бесплатно)
	let menuOpen = $state(false);
	let menuDialog: HTMLDialogElement | undefined = $state();

	const storeName = $derived($storeSettings?.name || 'Магазин');
	const cartLabel = $derived(
		$cartItemsCount > 0 ? `Корзина, товаров: ${$cartItemsCount}` : 'Корзина'
	);

	const navItems = $derived(
		[
			{ href: '/catalog', label: 'Каталог', show: true },
			{ href: '/contacts', label: 'Контакты', show: true },
			{ href: '/account', label: 'Личный кабинет', show: $authStore.isAuthenticated },
			{
				href: '/admin',
				label: 'Админ-панель',
				show: $authStore.isAuthenticated && $hasRole(['admin', 'manager'])
			}
		].filter((item) => item.show)
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
		menuOpen = false;
		authMode = 'login';
		showAuthModal = true;
	}

	function openRegister() {
		menuOpen = false;
		authMode = 'register';
		showAuthModal = true;
	}

	async function handleLogout() {
		await authStore.logout();
		menuOpen = false;
	}

	$effect(() => {
		if (!menuDialog) return;
		if (menuOpen) {
			if (!menuDialog.open) menuDialog.showModal();
		} else if (menuDialog.open) {
			menuDialog.close();
		}
	});

	// Переход по ссылке закрывает меню
	afterNavigate(() => {
		menuOpen = false;
	});

	function closeMenu() {
		menuOpen = false;
	}

	function handleMenuBackdropClick(event: MouseEvent) {
		if (event.target === menuDialog) closeMenu();
	}

	function handleMenuKeydown(event: KeyboardEvent) {
		if (event.key === 'Escape') {
			event.preventDefault();
			closeMenu();
		}
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
		const form = event.currentTarget as HTMLFormElement;
		const field = form.querySelector('input');
		if (!field?.value.trim()) event.preventDefault();
	}
</script>

<header class="bg-white shadow-md">
	<div class="container mx-auto px-4 py-3 md:py-4">
		<div class="flex items-center justify-between gap-3">
			<!-- Логотип -->
			<a
				href="/"
				class="inline-flex min-h-11 items-center truncate text-2xl font-bold text-gray-800"
			>
				{storeName}
			</a>

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
						class="w-full min-h-11 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
					/>
				</form>
			</div>

			<!-- Навигация (десктоп) -->
			<nav class="hidden md:flex items-center gap-2" aria-label="Основная навигация">
				{#each navItems as item (item.href)}
					<a
						href={item.href}
						class="inline-flex min-h-11 items-center rounded-md px-3 text-gray-700 hover:bg-gray-100 hover:text-gray-900 transition-colors"
						class:font-semibold={isActive(item.href)}
						aria-current={isActive(item.href) ? 'page' : undefined}
					>
						{item.label}
					</a>
				{/each}
			</nav>

			<!-- Действия -->
			<div class="flex items-center gap-1 md:gap-2">
				<!-- Корзина -->
				<a
					href="/cart"
					class="relative inline-flex h-11 w-11 items-center justify-center rounded-md text-gray-700 hover:bg-gray-100 transition-colors"
					aria-label={cartLabel}
				>
					<svg
						class="w-6 h-6"
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
							class="absolute top-0.5 right-0.5 bg-red-600 text-white text-xs font-medium rounded-full min-w-5 h-5 px-1 flex items-center justify-center tabular-nums"
							aria-hidden="true"
						>
							{$cartItemsCount > 99 ? '99+' : $cartItemsCount}
						</span>
					{/if}
				</a>

				<!-- Авторизация (десктоп) -->
				{#if $authStore.isAuthenticated}
					<div class="hidden md:flex items-center gap-2">
						<span class="text-sm text-gray-700 max-w-40 truncate">{$authStore.user?.username}</span>
						<button
							type="button"
							onclick={handleLogout}
							class="inline-flex min-h-11 items-center rounded-md px-4 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900 transition-colors"
						>
							Выход
						</button>
					</div>
				{:else}
					<div class="hidden md:flex items-center gap-2">
						<button
							type="button"
							onclick={openLogin}
							class="inline-flex min-h-11 items-center rounded-md px-4 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900 transition-colors"
						>
							Вход
						</button>
						<button
							type="button"
							onclick={openRegister}
							class="inline-flex min-h-11 items-center rounded-md bg-blue-600 px-4 text-sm text-white hover:bg-blue-700 transition-colors"
						>
							Регистрация
						</button>
					</div>
				{/if}

				<!-- Кнопка меню (мобильный) -->
				<button
					type="button"
					onclick={() => (menuOpen = true)}
					class="md:hidden inline-flex h-11 w-11 items-center justify-center rounded-md text-gray-700 hover:bg-gray-100 transition-colors"
					aria-label="Открыть меню"
					aria-expanded={menuOpen}
					aria-controls="mobile-menu"
				>
					<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M4 6h16M4 12h16M4 18h16"
						/>
					</svg>
				</button>
			</div>
		</div>

		<!-- Поиск (мобильный) -->
		<div class="md:hidden mt-3">
			<form action="/search" method="get" role="search" onsubmit={preventEmptySearch}>
				<input
					type="search"
					name="q"
					placeholder="Поиск товаров..."
					aria-label="Поиск товаров"
					enterkeyhint="search"
					class="w-full min-h-11 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
				/>
			</form>
		</div>
	</div>
</header>

<!-- Мобильное меню -->
<dialog
	id="mobile-menu"
	bind:this={menuDialog}
	onclose={closeMenu}
	onclick={handleMenuBackdropClick}
	onkeydown={handleMenuKeydown}
	aria-label="Меню"
	class="m-0 ml-auto h-full max-h-none w-[min(20rem,85vw)] bg-white p-0 text-gray-900 shadow-xl backdrop:bg-black/50 transition-transform duration-200 ease-out starting:translate-x-full motion-reduce:transition-none md:hidden"
>
	{#if menuOpen}
		<div class="flex h-full flex-col">
			<div class="flex items-center justify-between gap-3 border-b border-gray-200 px-4 py-3">
				<span class="truncate text-lg font-semibold text-gray-800">{storeName}</span>
				<button
					type="button"
					onclick={closeMenu}
					class="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-md text-gray-700 hover:bg-gray-100 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none"
					aria-label="Закрыть меню"
				>
					<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
					</svg>
				</button>
			</div>

			<nav class="flex-1 overflow-y-auto px-2 py-3" aria-label="Мобильная навигация">
				<ul class="space-y-1">
					{#each navItems as item (item.href)}
						<li>
							<a
								href={item.href}
								class="flex min-h-12 items-center rounded-md px-4 text-base transition-colors {isActive(item.href)
									? 'bg-blue-50 font-semibold text-blue-800'
									: 'text-gray-700 hover:bg-gray-100'}"
								aria-current={isActive(item.href) ? 'page' : undefined}
							>
								{item.label}
							</a>
						</li>
					{/each}
				</ul>
			</nav>

			<div class="border-t border-gray-200 p-4">
				{#if $authStore.isAuthenticated}
					<p class="mb-3 text-sm text-gray-600">
						Вы вошли как <span class="font-medium text-gray-900">{$authStore.user?.username}</span>
					</p>
					<button
						type="button"
						onclick={handleLogout}
						class="w-full min-h-11 rounded-md border border-gray-300 px-4 text-gray-700 transition-colors hover:bg-gray-50"
					>
						Выход
					</button>
				{:else}
					<div class="grid gap-2">
						<button
							type="button"
							onclick={openRegister}
							class="min-h-11 rounded-md bg-blue-600 px-4 font-medium text-white transition-colors hover:bg-blue-700"
						>
							Регистрация
						</button>
						<button
							type="button"
							onclick={openLogin}
							class="min-h-11 rounded-md border border-gray-300 px-4 text-gray-700 transition-colors hover:bg-gray-50"
						>
							Вход
						</button>
					</div>
				{/if}
			</div>
		</div>
	{/if}
</dialog>

<AuthModal bind:open={showAuthModal} bind:mode={authMode} />
