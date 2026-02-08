<script lang="ts">
	import { goto } from '$app/navigation';
	import { authStore, isAdminOrManager } from '$lib/stores/auth';
	import { onMount } from 'svelte';

	onMount(() => {
		if ($authStore.isAuthenticated && $isAdminOrManager) {
			// Перенаправляем на страницу товаров по умолчанию
			goto('/admin/products');
		}
	});
</script>

<svelte:head>
	<title>Админ-панель</title>
</svelte:head>

<div class="text-center py-12">
	<p class="text-gray-500">Загрузка...</p>
</div>
