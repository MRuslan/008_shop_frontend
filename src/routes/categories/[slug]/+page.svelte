<script lang="ts">
	import { page, navigating } from '$app/state';
	import ProductList from '$lib/components/product/ProductList.svelte';
	import Breadcrumbs from '$lib/components/catalog/Breadcrumbs.svelte';
	import CategoryChips, { type Chip } from '$lib/components/catalog/CategoryChips.svelte';
	import SortTabs, { type SortValue } from '$lib/components/catalog/SortTabs.svelte';
	import Pagination from '$lib/components/catalog/Pagination.svelte';
	import type { Product, Category, ProductFilters } from '$lib/types/product';
	import { storeSettings } from '$lib/stores/store';
	import { pluralize } from '$lib/utils/format';
	import { generateCollectionJsonLd, generateBreadcrumbJsonLd, jsonLdScript } from '$lib/utils/seo';
	import SlidersHorizontal from '@lucide/svelte/icons/sliders-horizontal';

	interface Props {
		data: {
			category: Category;
			parent: Category | null;
			products: Product[];
			total: number;
			page: number;
			limit: number;
			filters: ProductFilters;
		};
	}

	let { data }: Props = $props();

	// Состояние страницы живёт в URL, поэтому всё выводим из data: при переходе между категориями ничего не устаревает
	const totalPages = $derived(Math.max(1, Math.ceil(data.total / data.limit)));
	const sortValue = $derived(`${data.filters.sortBy || 'createAt'}-${data.filters.sortOrder || 'DESC'}`);
	const totalLabel = $derived(`${data.total}\u00a0${pluralize(data.total, ['товар', 'товара', 'товаров'])}`);
	const parentCategory = $derived(data.category.parent ?? data.parent);

	// Чипсы: подкатегории раздела, а у конечной категории — её соседи по разделу
	const chips = $derived.by((): Chip[] => {
		const children = data.category.children ?? [];
		if (children.length) {
			return [
				{ label: 'Все в разделе', href: `/categories/${data.category.slug}`, active: true },
				...children.map((child) => ({ label: child.name, href: `/categories/${child.slug}`, active: false }))
			];
		}
		if (data.parent?.children?.length) {
			return [
				{ label: 'Все в разделе', href: `/categories/${data.parent.slug}`, active: false },
				...data.parent.children.map((child) => ({
					label: child.name,
					href: `/categories/${child.slug}`,
					active: child.id === data.category.id
				}))
			];
		}
		return [];
	});

	const siteUrl = $derived(page.url.origin);
	const siteName = $derived($storeSettings?.name || 'Интернет-магазин');
	const categoryUrl = $derived(`${siteUrl}/categories/${data.category.slug}`);
	const description = $derived(`${data.category.name} в магазине ${siteName}: ${totalLabel}. Цены и наличие на сегодня.`);
	const breadcrumbs = $derived([
		{ name: 'Главная', url: '/' },
		{ name: 'Каталог', url: '/catalog' },
		...(parentCategory ? [{ name: parentCategory.name, url: `/categories/${parentCategory.slug}` }] : []),
		{ name: data.category.name, url: `/categories/${data.category.slug}` }
	]);

	function buildUrl(pageNumber: number, sort: string): string {
		const params = new URLSearchParams();
		if (sort !== 'createAt-DESC') {
			const [sortBy, sortOrder] = sort.split('-');
			params.set('sortBy', sortBy);
			params.set('sortOrder', sortOrder);
		}
		if (pageNumber > 1) params.set('page', pageNumber.toString());
		const query = params.toString();
		return `/categories/${data.category.slug}${query ? `?${query}` : ''}`;
	}

	const isUpdating = $derived(navigating.to?.url.pathname === page.url.pathname);
</script>

<svelte:head>
	<title>{data.category.name} | {siteName}</title>
	<meta name="description" content={description} />
	<meta property="og:title" content={`${data.category.name} | ${siteName}`} />
	<meta property="og:description" content={description} />
	<meta property="og:type" content="website" />
	<meta property="og:url" content={categoryUrl} />
	{#if $storeSettings?.logoUrl}
		<meta property="og:image" content={$storeSettings.logoUrl} />
	{/if}
	<meta property="og:site_name" content={siteName} />
	<meta name="twitter:card" content="summary" />
	<meta name="twitter:title" content={`${data.category.name} | ${siteName}`} />
	<meta name="twitter:description" content={description} />
	<link rel="canonical" href={categoryUrl} />

	<!-- eslint-disable-next-line svelte/no-at-html-tags -- jsonLdScript экранирует <, > и &, закрыть тег script нельзя -->

	{@html jsonLdScript(generateCollectionJsonLd(data.products, data.category, $storeSettings, siteUrl))}
	<!-- eslint-disable-next-line svelte/no-at-html-tags -- jsonLdScript экранирует <, > и &, закрыть тег script нельзя -->
	{@html jsonLdScript(generateBreadcrumbJsonLd(breadcrumbs, siteUrl))}
</svelte:head>

<div class="container py-4 md:py-6">
	<Breadcrumbs items={breadcrumbs.map((crumb) => ({ name: crumb.name, href: crumb.url }))} />

	<div class="mt-2 flex flex-wrap items-baseline gap-x-3 gap-y-1">
		<h1 class="text-headline text-balance text-ink md:text-headline-lg">{data.category.name}</h1>
		<p class="text-gray-500" role="status">{totalLabel}</p>
	</div>

	{#if chips.length}
		<div class="mt-4">
			<CategoryChips {chips} />
		</div>
	{/if}

	<div class="mt-3 mb-3 flex items-center gap-2 lg:mt-5">
		<SortTabs value={sortValue} href={(value: SortValue) => buildUrl(1, value)} />
		<a
			href="/catalog?categoryId={data.category.id}"
			class="ml-auto inline-flex h-11 shrink-0 items-center gap-2 rounded-xl bg-surface px-3.5 text-sm font-medium text-ink hover:bg-gray-50"
		>
			<SlidersHorizontal class="size-4" aria-hidden="true" />
			Фильтры
		</a>
	</div>

	{#if data.products.length === 0}
		<div class="rounded-2xl bg-surface px-6 py-12 text-center">
			{#if data.category.children?.length}
				<p class="font-semibold text-ink">Товары этого раздела лежат в подкатегориях</p>
				<p class="mt-1 text-sm text-gray-600">Выберите подкатегорию выше.</p>
			{:else}
				<p class="font-semibold text-ink">В этой категории пока нет товаров</p>
				<a
					href="/catalog"
					class="mt-5 inline-flex h-11 items-center rounded-xl bg-ink px-5 text-sm font-medium text-white transition-colors hover:bg-ink-hover"
				>
					Весь каталог
				</a>
			{/if}
		</div>
	{:else}
		<div class="transition-opacity duration-200 {isUpdating ? 'opacity-60' : ''}" aria-busy={isUpdating}>
			<ProductList products={data.products} />
		</div>
		<Pagination
			current={data.page}
			total={totalPages}
			href={(pageNumber) => buildUrl(pageNumber, sortValue)}
			label="Страницы категории"
		/>
	{/if}
</div>
