<script lang="ts">
	import '@fontsource-variable/onest';
	import '../lib/styles/global.css';
	import { onMount } from 'svelte';
	import { page } from '$app/state';
	import { onNavigate } from '$app/navigation';
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

	let { data, children } = $props();

	// Настройки магазина: сразу для SSR и первого рендера, и дальше при каждой инвалидации данных
	storeSettings.set(data.store ?? null);
	setDisplayTimeZone(data.store?.timezone);
	$effect(() => {
		storeSettings.set(data.store ?? null);
		setDisplayTimeZone(data.store?.timezone);
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
		await authStore.init();
		// Корзина зависит от того, авторизован ли пользователь
		await cartStore.init();
	});
</script>

<svelte:head>
	<!-- Своя иконка магазина из настроек; иначе остаётся общая из app.html -->
	{#if data.store?.faviconUrl}
		<link rel="icon" href={data.store.faviconUrl} />
	{/if}
</svelte:head>

<NavigationProgress />

<div
	class="flex min-h-screen flex-col {showTabBar
		? 'pb-[calc(var(--tabbar-height)+env(safe-area-inset-bottom))] md:pb-0'
		: ''}"
>
	<Header />
	<main class="flex-grow">
		{@render children()}
	</main>
	<Footer />
</div>

{#if showTabBar}
	<TabBar />
{/if}

<Toaster />
<ConfirmDialog />
