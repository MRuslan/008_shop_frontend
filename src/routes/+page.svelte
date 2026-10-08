<script lang="ts">
	import { siteOrigin } from '$lib/utils/site';
	import { page } from '$app/state';
	import { storeSettings } from '$lib/stores/store';
	import { generateOrganizationJsonLd, generateWebSiteJsonLd, jsonLdScript } from '$lib/utils/seo';

	const siteUrl = $derived(siteOrigin(page.url));
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
	<meta name="twitter:card" content={$storeSettings?.logoUrl ? 'summary_large_image' : 'summary'} />
	<meta name="twitter:title" content={siteName} />
	<meta name="twitter:description" content={description} />
	{#if $storeSettings?.logoUrl}
		<meta name="twitter:image" content={$storeSettings.logoUrl} />
	{/if}
	<link rel="canonical" href="{siteUrl}/" />

	<!-- Название сайта в выдаче и строка поиска по сайту прямо в результатах -->
	<!-- eslint-disable-next-line svelte/no-at-html-tags -- jsonLdScript экранирует <, > и &, закрыть тег script нельзя -->
	{@html jsonLdScript(generateWebSiteJsonLd(siteName, siteUrl))}
	{#if $storeSettings}
		<!-- eslint-disable-next-line svelte/no-at-html-tags -- jsonLdScript экранирует <, > и &, закрыть тег script нельзя -->
		{@html jsonLdScript(generateOrganizationJsonLd($storeSettings, siteUrl))}
	{/if}
</svelte:head>

<div class="container py-12 md:py-16">
	<div class="text-center">
		<h1 class="text-headline md:text-headline-lg text-balance text-ink mb-4">
			Добро пожаловать в {$storeSettings?.name || 'наш магазин'}!
		</h1>
		<p class="text-body text-gray-600 mb-8">
			Найдите всё, что вам нужно
		</p>
		<a
			href="/catalog"
			class="btn-primary btn-lg"
		>
			Перейти в каталог
		</a>
	</div>
</div>
