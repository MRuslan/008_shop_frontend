<script lang="ts">
	import { onMount } from 'svelte';
	import { authStore, hasRole } from '$lib/stores/auth';
	import { cartItemsCount } from '$lib/stores/cart';
	import { page } from '$app/stores';
	import AuthModal from '$lib/components/auth/AuthModal.svelte';

	let showAuthModal = $state(false);
	let authMode: 'login' | 'register' = $state('login');

	onMount(() => {
		// Инициализируем auth store при монтировании
		authStore.init();
	});

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
</script>

<header class="bg-white shadow-md">
	<div class="container mx-auto px-4 py-4">
		<!-- Mobile Search -->
		<div class="md:hidden mb-4">
			<form
				action="/search"
				method="get"
				onsubmit={(e) => {
					const form = e.currentTarget;
					const input = form.querySelector('input') as HTMLInputElement;
					if (!input?.value.trim()) {
						e.preventDefault();
					}
				}}
			>
				<input
					type="text"
					name="q"
					placeholder="Поиск товаров..."
					class="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
				/>
			</form>
		</div>

		<div class="flex items-center justify-between">
			<!-- Logo -->
			<div class="flex items-center">
				<a href="/" class="text-2xl font-bold text-gray-800">
					Shop
				</a>
			</div>

			<!-- Search (Desktop) -->
			<div class="hidden md:flex flex-1 max-w-md mx-4">
				<form
					action="/search"
					method="get"
					class="w-full"
					onsubmit={(e) => {
						const form = e.currentTarget;
						const input = form.querySelector('input') as HTMLInputElement;
						if (!input?.value.trim()) {
							e.preventDefault();
						}
					}}
				>
					<input
						type="text"
						name="q"
						placeholder="Поиск товаров..."
						class="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
					/>
				</form>
			</div>

			<!-- Navigation -->
			<nav class="hidden md:flex items-center space-x-6">
				<a
					href="/catalog"
					class="text-gray-700 hover:text-gray-900 transition-colors"
					class:font-semibold={$page.url.pathname.startsWith('/catalog')}
				>
					Каталог
				</a>
				{#if $authStore.isAuthenticated}
					<a
						href="/account"
						class="text-gray-700 hover:text-gray-900 transition-colors"
						class:font-semibold={$page.url.pathname.startsWith('/account')}
					>
						Личный кабинет
					</a>
					{#if $hasRole(['admin', 'manager'])}
						<a
							href="/admin"
							class="text-gray-700 hover:text-gray-900 transition-colors"
							class:font-semibold={$page.url.pathname.startsWith('/admin')}
						>
							Админ-панель
						</a>
					{/if}
				{/if}
			</nav>

			<!-- Actions -->
			<div class="flex items-center space-x-4">
				<!-- Cart -->
				<a href="/cart" class="relative">
					<svg
						class="w-6 h-6 text-gray-700"
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
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
						>
							{$cartItemsCount}
						</span>
					{/if}
				</a>

				<!-- Auth -->
				{#if $authStore.isAuthenticated}
					<div class="flex items-center space-x-2">
						<span class="text-sm text-gray-700">{$authStore.user?.username}</span>
						<button
							onclick={handleLogout}
							class="px-4 py-2 text-sm text-gray-700 hover:text-gray-900 transition-colors"
						>
							Выход
						</button>
					</div>
				{:else}
					<div class="flex items-center space-x-2">
						<button
							onclick={openLogin}
							class="px-4 py-2 text-sm text-gray-700 hover:text-gray-900 transition-colors"
						>
							Вход
						</button>
						<button
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
