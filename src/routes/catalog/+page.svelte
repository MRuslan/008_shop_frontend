<script lang="ts">
	import { siteOrigin } from '$lib/utils/site';
	import { goto } from '$app/navigation';
	import { page, navigating } from '$app/state';
	import ProductList from '$lib/components/product/ProductList.svelte';
	import ProductFilters from '$lib/components/product/ProductFilters.svelte';
	import Breadcrumbs from '$lib/components/catalog/Breadcrumbs.svelte';
	import CategoryChips, { type Chip } from '$lib/components/catalog/CategoryChips.svelte';
	import SortTabs, { type SortValue } from '$lib/components/catalog/SortTabs.svelte';
	import Pagination from '$lib/components/catalog/Pagination.svelte';
	import type { Product, ProductFilters as ProductFiltersType, Category } from '$lib/types/product';
	import { storeSettings } from '$lib/stores/store';
	import { pluralize } from '$lib/utils/format';
	import { generateCollectionJsonLd, generateBreadcrumbJsonLd, jsonLdScript } from '$lib/utils/seo';
	import SlidersHorizontal from '@lucide/svelte/icons/sliders-horizontal';
	import X from '@lucide/svelte/icons/x';

	interface Props {
		data: {
			products: Product[];
			total: number;
			page: number;
			limit: number;
			categories: Category[];
			filters: ProductFiltersType;
		};
	}

	let { data }: Props = $props();

	// Всё состояние страницы живёт в URL: данные приходят из load и не устаревают при навигации
	const totalPages = $derived(Math.max(1, Math.ceil(data.total / data.limit)));
	const sortValue = $derived(`${data.filters.sortBy || 'createAt'}-${data.filters.sortOrder || 'DESC'}`);
	const totalLabel = $derived(`${data.total}\u00a0${pluralize(data.total, ['товар', 'товара', 'товаров'])}`);

	function findCategory(list: Category[], id: number | null | undefined): Category | undefined {
		if (id == null) return undefined;
		for (const category of list) {
			if (category.id === id) return category;
			const nested = findCategory(category.children ?? [], id);
			if (nested) return nested;
		}
		return undefined;
	}

	const selected = $derived(findCategory(data.categories, data.filters.categoryId));
	const parent = $derived(findCategory(data.categories, selected?.parentId));
	const title = $derived(selected?.name ?? 'Каталог');

	// Чипсы показывают текущий уровень дерева: первый чипс — «весь уровень», дальше его разделы
	const chips = $derived.by((): Chip[] => {
		const chip = (category: Category | undefined, label?: string): Chip => ({
			label: label ?? category?.name ?? 'Все товары',
			href: buildUrl({ ...data.filters, categoryId: category?.id }, 1),
			active: category?.id === selected?.id
		});
		if (selected?.children?.length) {
			return [chip(selected, 'Все в разделе'), ...selected.children.map((child) => chip(child))];
		}
		if (parent) {
			return [chip(parent, 'Все в разделе'), ...(parent.children ?? []).map((child) => chip(child))];
		}
		return [chip(undefined), ...data.categories.map((category) => chip(category))];
	});

	const activeFilterCount = $derived(
		[
			data.filters.categoryId !== undefined,
			data.filters.minPrice !== undefined || data.filters.maxPrice !== undefined,
			!!data.filters.inStock
		].filter(Boolean).length
	);

	const siteUrl = $derived(siteOrigin(page.url));
	const siteName = $derived($storeSettings?.name || 'Интернет-магазин');
	const description = $derived(`${title} в магазине ${siteName}: ${totalLabel}. Цены и наличие на сегодня.`);
	const breadcrumbs = $derived([
		{ name: 'Главная', url: '/' },
		{ name: 'Каталог', url: '/catalog' },
		// У раздела один адрес — /categories/<slug>; ссылки и разметка ведут туда, а не на ?categoryId=
		...(parent ? [{ name: parent.name, url: `/categories/${parent.slug}` }] : []),
		...(selected ? [{ name: selected.name, url: `/categories/${selected.slug}` }] : [])
	]);

	// Выборка с фильтрами (цена, наличие, поиск) — не отдельная страница для поисковиков:
	// noindex и canonical на сам раздел. Сортировка тоже не новая страница, её в canonical нет
	const isFiltered = $derived(
		!!data.filters.search ||
			data.filters.minPrice !== undefined ||
			data.filters.maxPrice !== undefined ||
			!!data.filters.inStock
	);
	const listPath = $derived(selected ? `/categories/${selected.slug}` : '/catalog');
	const canonicalUrl = $derived(`${siteUrl}${listPath}${!isFiltered && data.page > 1 ? `?page=${data.page}` : ''}`);
	const pageSuffix = $derived(data.page > 1 ? ` — страница ${data.page}` : '');
	const ogImage = $derived(
		data.products.find((product) => product.images?.[0]?.url)?.images?.[0]?.url ?? $storeSettings?.logoUrl ?? null
	);

	function buildUrl(filters: ProductFiltersType, pageNumber: number): string {
		const params = new URLSearchParams();

		if (filters.search) params.set('search', filters.search);
		if (filters.categoryId) params.set('categoryId', filters.categoryId.toString());
		if (filters.minPrice !== undefined) params.set('minPrice', filters.minPrice.toString());
		if (filters.maxPrice !== undefined) params.set('maxPrice', filters.maxPrice.toString());
		if (filters.inStock) params.set('inStock', 'true');
		// Сортировка по умолчанию (новинки) в адрес не пишется
		const sortBy = filters.sortBy ?? 'createAt';
		const sortOrder = filters.sortOrder ?? 'DESC';
		if (sortBy !== 'createAt' || sortOrder !== 'DESC') {
			params.set('sortBy', sortBy);
			params.set('sortOrder', sortOrder);
		}
		if (pageNumber > 1) params.set('page', pageNumber.toString());
		if (filters.limit && filters.limit !== 20) params.set('limit', filters.limit.toString());

		const query = params.toString();
		return `/catalog${query ? `?${query}` : ''}`;
	}

	function sortHref(value: SortValue): string {
		const [sortBy, sortOrder] = value.split('-') as [ProductFiltersType['sortBy'], ProductFiltersType['sortOrder']];
		return buildUrl({ ...data.filters, sortBy, sortOrder }, 1);
	}

	function handleFiltersChange(newFilters: ProductFiltersType) {
		// Лист фильтров на телефоне остаётся открытым: список за ним обновляется сразу
		goto(buildUrl(newFilters, 1), { noScroll: true, keepFocus: true });
	}

	// Идёт переход внутри каталога: приглушаем сетку, чтобы было видно, что список обновляется
	const isUpdating = $derived(navigating.to?.url.pathname === '/catalog');

	// Лист фильтров на телефоне: нативный <dialog> даёт ловушку фокуса и подложку
	let sheetOpen = $state(false);
	let sheet: HTMLDialogElement | undefined = $state();

	$effect(() => {
		if (!sheet) return;
		if (sheetOpen && !sheet.open) sheet.showModal();
		if (!sheetOpen && sheet.open) sheet.close();
	});

	function handleSheetClick(event: MouseEvent) {
		if (event.target === sheet) sheetOpen = false;
	}

	function handleSheetKeydown(event: KeyboardEvent) {
		if (event.key === 'Escape') {
			event.preventDefault();
			sheetOpen = false;
		}
	}
</script>

<svelte:head>
	<title>{title}{pageSuffix} | {siteName}</title>
	<meta name="description" content={description} />
	{#if isFiltered}
		<meta name="robots" content="noindex, follow" />
	{/if}
	<meta property="og:title" content={`${title} | ${siteName}`} />
	<meta property="og:description" content={description} />
	<meta property="og:type" content="website" />
	<meta property="og:url" content={canonicalUrl} />
	{#if ogImage}
		<meta property="og:image" content={ogImage} />
	{/if}
	<meta property="og:site_name" content={siteName} />
	<meta name="twitter:card" content={ogImage ? 'summary_large_image' : 'summary'} />
	<meta name="twitter:title" content={`${title} | ${siteName}`} />
	<meta name="twitter:description" content={description} />
	<link rel="canonical" href={canonicalUrl} />

	<!-- eslint-disable-next-line svelte/no-at-html-tags -- jsonLdScript экранирует <, > и &, закрыть тег script нельзя -->
	{@html jsonLdScript(generateCollectionJsonLd(data.products, selected ?? null, siteUrl, canonicalUrl, (data.page - 1) * data.limit))}
	<!-- eslint-disable-next-line svelte/no-at-html-tags -- jsonLdScript экранирует <, > и &, закрыть тег script нельзя -->
	{@html jsonLdScript(generateBreadcrumbJsonLd(breadcrumbs, siteUrl))}
</svelte:head>

<div class="container py-4 md:py-6">
	<Breadcrumbs items={breadcrumbs.map((crumb) => ({ name: crumb.name, href: crumb.url }))} />

	<div class="mt-2 flex flex-wrap items-baseline gap-x-3 gap-y-1">
		<h1 class="text-headline text-balance text-ink md:text-headline-lg">{title}</h1>
		<p class="text-gray-500" role="status">{totalLabel}</p>
	</div>

	<!-- На десктопе те же разделы уже в боковой панели фильтров: второй раз их не показываем -->
	<div class="mt-4 lg:hidden">
		<CategoryChips {chips} />
	</div>

	<div class="mt-3 lg:mt-5 lg:grid lg:grid-cols-[16rem_minmax(0,1fr)] lg:items-start lg:gap-6">
		<aside class="hidden lg:sticky lg:top-4 lg:block" aria-label="Фильтры">
			<div class="rounded-2xl bg-surface p-5">
				<ProductFilters filters={data.filters} categories={data.categories} onFiltersChange={handleFiltersChange} />
			</div>
		</aside>

		<div class="min-w-0">
			<div class="mb-3 flex items-center gap-2">
				<SortTabs value={sortValue} href={sortHref} />
				<button
					type="button"
					onclick={() => (sheetOpen = true)}
					aria-haspopup="dialog"
					aria-controls="catalog-filters"
					class="ml-auto inline-flex h-11 shrink-0 items-center gap-2 rounded-xl bg-surface px-3.5 text-control text-ink lg:hidden"
				>
					<SlidersHorizontal class="size-4" aria-hidden="true" />
					Фильтры
					{#if activeFilterCount}
						<span class="inline-flex size-5 items-center justify-center rounded-full bg-ink text-tab leading-none font-semibold text-white tabular-nums">
							{activeFilterCount}
						</span>
					{/if}
				</button>
			</div>

			{#if data.products.length === 0}
				<!-- Раздел показывает и товары подкатегорий, поэтому пусто — значит, правда пусто -->
				<div class="rounded-2xl bg-surface px-6 py-12 text-center">
					<p class="font-semibold text-ink">Ничего не нашлось</p>
					<p class="mt-1 text-sm text-gray-600">
						{activeFilterCount ? 'Попробуйте убрать часть фильтров.' : 'В каталоге пока нет товаров.'}
					</p>
					{#if activeFilterCount}
						<a
							href="/catalog"
							class="btn-primary mt-5"
						>
							Сбросить фильтры
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
					href={(pageNumber) => buildUrl(data.filters, pageNumber)}
					label="Страницы каталога"
				/>
			{/if}
		</div>
	</div>
</div>

<dialog
	id="catalog-filters"
	bind:this={sheet}
	onclose={() => (sheetOpen = false)}
	onclick={handleSheetClick}
	onkeydown={handleSheetKeydown}
	aria-labelledby="catalog-filters-title"
	class="m-0 mt-auto max-h-[85dvh] w-full max-w-none rounded-t-3xl bg-surface p-0 text-gray-900 transition-transform duration-300 ease-out-quart backdrop:bg-black/40 starting:translate-y-full lg:hidden"
>
	{#if sheetOpen}
		<div class="flex max-h-[85dvh] flex-col">
			<div class="flex items-center justify-between px-5 pt-4 pb-2">
				<h2 id="catalog-filters-title" class="text-title text-ink">Фильтры</h2>
				<button
					type="button"
					onclick={() => (sheetOpen = false)}
					aria-label="Закрыть фильтры"
					class="-mr-2 inline-flex size-11 items-center justify-center rounded-full text-gray-600 hover:bg-gray-100"
				>
					<X class="size-5" aria-hidden="true" />
				</button>
			</div>
			<div class="flex-1 overflow-y-auto px-5 pb-4">
				<ProductFilters filters={data.filters} categories={data.categories} onFiltersChange={handleFiltersChange} />
			</div>
			<div class="border-t border-line px-5 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
				<button
					type="button"
					onclick={() => (sheetOpen = false)}
					class="flex h-13 w-full items-center justify-center rounded-xl bg-ink text-base font-medium text-white transition-colors hover:bg-ink-hover"
				>
					Показать {totalLabel}
				</button>
			</div>
		</div>
	{/if}
</dialog>
