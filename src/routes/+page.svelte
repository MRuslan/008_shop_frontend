<script lang="ts">
	import { page } from '$app/state';
	import { storeSettings } from '$lib/stores/store';
	import { generateOrganizationJsonLd } from '$lib/utils/seo';

	const siteUrl = $derived(page.url.origin);
	const siteName = $derived($storeSettings?.name || 'Интернет-магазин');
	const description = $derived(
		$storeSettings?.name
			? `Добро пожаловать в ${$storeSettings.name}! Широкий ассортимент товаров по выгодным ценам.`
			: 'Добро пожаловать в наш интернет-магазин'
	);
</script>

<svelte:head>
	<title>{siteName}</title>
	<meta name="description" content={description} />
	<meta property="og:title" content={siteName} />
	<meta property="og:description" content={description} />
	<meta property="og:type" content="website" />
	<meta property="og:url" content="{siteUrl}/" />
	{#if $storeSettings?.logoUrl}
		<meta property="og:image" content={$storeSettings.logoUrl} />
	{/if}
	<meta property="og:site_name" content={siteName} />
	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:title" content={siteName} />
	<meta name="twitter:description" content={description} />
	{#if $storeSettings?.logoUrl}
		<meta name="twitter:image" content={$storeSettings.logoUrl} />
	{/if}
	<link rel="canonical" href="{siteUrl}/" />

	{#if $storeSettings}
		{@html `<script type="application/ld+json">${JSON.stringify(generateOrganizationJsonLd($storeSettings, siteUrl))}</script>`}
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
