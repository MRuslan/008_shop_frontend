<script lang="ts">
	import { storeSettings } from '$lib/stores/store';
	import { generateOrganizationJsonLd } from '$lib/utils/seo';
	import { page } from '$app/stores';

	const siteUrl = typeof window !== 'undefined' ? window.location.origin : '';
</script>

<svelte:head>
	<title>{$storeSettings?.name || 'Интернет-магазин'}</title>
	<meta name="description" content={$storeSettings?.name ? `Добро пожаловать в ${$storeSettings.name}! Широкий ассортимент товаров по выгодным ценам.` : 'Добро пожаловать в наш интернет-магазин'} />
	<meta property="og:title" content={$storeSettings?.name || 'Интернет-магазин'} />
	<meta property="og:description" content={$storeSettings?.name ? `Добро пожаловать в ${$storeSettings.name}! Широкий ассортимент товаров по выгодным ценам.` : 'Добро пожаловать в наш интернет-магазин'} />
	<meta property="og:type" content="website" />
	<meta property="og:url" content={siteUrl} />
	{#if $storeSettings?.logoUrl}
		<meta property="og:image" content={$storeSettings.logoUrl} />
	{/if}
	<meta property="og:site_name" content={$storeSettings?.name || 'Интернет-магазин'} />
	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:title" content={$storeSettings?.name || 'Интернет-магазин'} />
	<meta name="twitter:description" content={$storeSettings?.name ? `Добро пожаловать в ${$storeSettings.name}! Широкий ассортимент товаров по выгодным ценам.` : 'Добро пожаловать в наш интернет-магазин'} />
	{#if $storeSettings?.logoUrl}
		<meta name="twitter:image" content={$storeSettings.logoUrl} />
	{/if}
	<link rel="canonical" href={siteUrl} />
	
	{#if $storeSettings}
		{@html `<script type="application/ld+json">${JSON.stringify(generateOrganizationJsonLd($storeSettings))}</script>`}
	{/if}
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
