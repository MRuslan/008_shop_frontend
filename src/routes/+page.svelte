<script lang="ts">
	import { storeSettings } from '$lib/stores/store';
</script>

<svelte:head>
	<title>{$storeSettings?.name || 'Интернет-магазин'}</title>
	<meta name="description" content="Добро пожаловать в наш интернет-магазин" />
</svelte:head>

<div class="container mx-auto px-4 py-12">
	<div class="text-center">
		<h1 class="text-4xl font-bold text-gray-800 mb-4">
			Добро пожаловать в {$storeSettings?.name || 'наш магазин'}!
		</h1>
		<p class="text-xl text-gray-600 mb-8">
			Найдите всё, что вам нужно
		</p>
		<a
			href="/catalog"
			class="inline-block bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 transition-colors"
		>
			Перейти в каталог
		</a>
	</div>
</div>
