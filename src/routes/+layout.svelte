<script lang="ts">
	import '../lib/styles/global.css';
	import { onMount } from 'svelte';
	import Header from '$lib/components/layout/Header.svelte';
	import Footer from '$lib/components/layout/Footer.svelte';
	import Toaster from '$lib/components/ui/Toaster.svelte';
	import ConfirmDialog from '$lib/components/ui/ConfirmDialog.svelte';
	import { storeSettings } from '$lib/stores/store';
	import { authStore } from '$lib/stores/auth';
	import { cartStore } from '$lib/stores/cart';

	let { data, children } = $props();

	// Настройки магазина: сразу для SSR и первого рендера, и дальше при каждой инвалидации данных
	storeSettings.set(data.store ?? null);
	$effect(() => {
		storeSettings.set(data.store ?? null);
	});

	onMount(async () => {
		await authStore.init();
		// Корзина зависит от того, авторизован ли пользователь
		await cartStore.init();
	});
</script>

<div class="min-h-screen flex flex-col">
	<Header />
	<main class="flex-grow">
		{@render children()}
	</main>
	<Footer />
</div>

<Toaster />
<ConfirmDialog />
