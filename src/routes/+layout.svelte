<script lang="ts">
	import '../lib/styles/global.css';
	import Header from '$lib/components/layout/Header.svelte';
	import Footer from '$lib/components/layout/Footer.svelte';
	import { storeSettings } from '$lib/stores/store';
	import { onMount } from 'svelte';

	let { data, children } = $props();

	// Устанавливаем настройки магазина в store
	$storeSettings = data.store;

	onMount(() => {
		// Инициализируем auth store на клиенте
		import('$lib/stores/auth').then(({ authStore }) => {
			authStore.init();
		});
	});
</script>

<div class="min-h-screen flex flex-col">
	<Header />
	<main class="flex-grow">
		{@render children()}
	</main>
	<Footer />
</div>
