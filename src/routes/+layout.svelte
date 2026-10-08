<script lang="ts">
	import '@fontsource-variable/onest';
	import '../lib/styles/global.css';
	import { onMount, untrack } from 'svelte';
	import { page } from '$app/state';
	import { invalidateAll, onNavigate } from '$app/navigation';
	import Header from '$lib/components/layout/Header.svelte';
	import Footer from '$lib/components/layout/Footer.svelte';
	import TabBar from '$lib/components/layout/TabBar.svelte';
	import NavigationProgress from '$lib/components/layout/NavigationProgress.svelte';
	import Toaster from '$lib/components/ui/Toaster.svelte';
	import ConfirmDialog from '$lib/components/ui/ConfirmDialog.svelte';
	import { storeSettings } from '$lib/stores/store';
	import { authStore } from '$lib/stores/auth';
	import { cartStore } from '$lib/stores/cart';
	import { setDisplayTimeZone } from '$lib/utils/format';
	import { migrateLegacySession } from '$lib/utils/legacy-session';

	let { data, children } = $props();

	// Настройки магазина, вход и корзина: сразу для SSR и первого рендера, и дальше при каждой
	// повторной загрузке корневого layout (вход, выход, invalidateAll). Сторы общие для всех запросов
	// сервера, но SSR синхронный: значения пишутся в начале рендера и читаются в том же проходе,
	// чужой запрос между ними не вклинится. Включая experimental.async, это место надо пересмотреть
	untrack(() => {
		storeSettings.set(data.store ?? null);
		setDisplayTimeZone(data.store?.timezone);
		authStore.hydrate(data.user ?? null, data.signedIn);
		cartStore.hydrate(data.cart ?? null);
	});
	$effect(() => {
		storeSettings.set(data.store ?? null);
		setDisplayTimeZone(data.store?.timezone);
	});
	// data корневого layout меняется, только когда он загрузился заново. Обычный переход его не трогает,
	// поэтому корзину, только что изменённую в браузере, эффект не откатит к снимку с сервера
	$effect(() => {
		authStore.hydrate(data.user ?? null, data.signedIn);
		cartStore.hydrate(data.cart ?? null);
		// Вход есть, а профиль сервер получить не смог (бэкенд перегружен или перезапускается): догружаем
		if (data.signedIn && !data.user) void authStore.loadProfile();
	});

	// Админка — рабочий инструмент: нижние вкладки покупателя ей не нужны
	const showTabBar = $derived(!page.url.pathname.startsWith('/admin'));

	// Смена раздела растворением (View Transitions): даже мгновенный переход не дёргается,
	// а скачок вёрстки прячется внутри перехода. onNavigate срабатывает, когда данные новой страницы
	// уже загружены, поэтому переход не замедляет навигацию. Фильтры, сортировка и страницы каталога
	// меняют страницу на месте со своей подсветкой загрузки, их не трогаем
	onNavigate((navigation) => {
		if (!document.startViewTransition) return;
		if (navigation.from?.url.pathname === navigation.to?.url.pathname) return;
		if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;

		return new Promise((resolve) => {
			const transition = document.startViewTransition(async () => {
				resolve();
				// Сорвавшийся переход просто заканчивает анимацию, ошибку обработает сама навигация
				await navigation.complete.catch(() => {});
			});
			// В скрытой вкладке или при быстрых кликах подряд браузер отменяет анимацию.
			// Смена страницы всё равно происходит, а отказ не должен сыпаться в консоль
			transition.ready.catch(() => {});
			transition.finished.catch(() => {});
		});
	});

	onMount(async () => {
		if (await migrateLegacySession()) await invalidateAll();
	});
</script>

<svelte:head>
	<!-- Своя иконка магазина из настроек; иначе остаётся общая из app.html -->
	{#if data.store?.faviconUrl}
		<link rel="icon" href={data.store.faviconUrl} />
	{/if}
</svelte:head>

<NavigationProgress />

<!-- Первая остановка Tab: сразу к содержимому, мимо шапки с поиском и разделами -->
<a
	href="#main"
	class="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:inline-flex focus:h-11 focus:items-center focus:rounded-xl focus:bg-ink focus:px-4 focus:text-control focus:text-white"
>
	Перейти к содержимому
</a>

<div
	class="flex min-h-screen flex-col {showTabBar
		? 'pb-[calc(var(--tabbar-height)+env(safe-area-inset-bottom))] md:pb-0'
		: ''}"
>
	<Header />
	<main id="main" tabindex="-1" class="flex-grow">
		{@render children()}
	</main>
	<Footer />
</div>

{#if showTabBar}
	<TabBar />
{/if}

<Toaster />
<ConfirmDialog />
