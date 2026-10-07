<script lang="ts">
	import { siteOrigin } from '$lib/utils/site';
	import { page } from '$app/state';
	import type { Product, Category } from '$lib/types/product';
	import type { Review } from '$lib/types/common';
	import { formatPrice, discountPercent, pluralize } from '$lib/utils/format';
	import { deliveryTerms } from '$lib/utils/delivery';
	import { storeSettings } from '$lib/stores/store';
	import { cartLines } from '$lib/stores/cart';
	import { wishlistStore } from '$lib/stores/wishlist';
	import ProductReviews from '$lib/components/product/ProductReviews.svelte';
	import CartControl from '$lib/components/product/CartControl.svelte';
	import StockStatus from '$lib/components/product/StockStatus.svelte';
	import Breadcrumbs from '$lib/components/catalog/Breadcrumbs.svelte';
	import { generateProductJsonLd, generateBreadcrumbJsonLd, jsonLdScript, metaDescription } from '$lib/utils/seo';
	import Heart from '@lucide/svelte/icons/heart';
	import Star from '@lucide/svelte/icons/star';
	import Store from '@lucide/svelte/icons/store';
	import Truck from '@lucide/svelte/icons/truck';
	import Wallet from '@lucide/svelte/icons/wallet';
	import ImageOff from '@lucide/svelte/icons/image-off';
	import ChevronRight from '@lucide/svelte/icons/chevron-right';

	interface Props {
		data: {
			product: Product;
			category: Category | null;
			reviews: Review[] | null;
			rating: { average: number; count: number } | null;
			pickup: { total: number; withStock: number | null } | null;
		};
	}

	let { data }: Props = $props();

	// Всё, что зависит от товара, выводим из data: при переходе между товарами без перезагрузки ничего не устаревает
	const product = $derived(data.product);
	const images = $derived(product.images ?? []);
	const currency = $derived($storeSettings?.currency || 'RUB');
	const discount = $derived(discountPercent(product.price, product.compareAtPrice));
	const saving = $derived(
		discount > 0 && product.compareAtPrice ? parseFloat(product.compareAtPrice) - parseFloat(product.price) : 0
	);
	const inCart = $derived($cartLines.has(product.id));
	const isFavorite = $derived($wishlistStore.has(product.id));
	const ratingLabel = $derived(
		data.rating
			? `${data.rating.average.toLocaleString('ru-RU', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} · ${data.rating.count} ${pluralize(data.rating.count, ['отзыв', 'отзыва', 'отзывов'])}`
			: null
	);
	const attributes = $derived(product.attributes ?? []);

	// Способы получения из настроек магазина; выключенный способ не обещаем
	const settings = $derived($storeSettings?.settings ?? null);
	const deliveryOn = $derived(settings?.delivery.enabled ?? true);
	const pickupOn = $derived(settings?.pickup.enabled ?? true);
	const deliveryText = $derived(deliveryTerms(settings?.delivery, currency) ?? 'Адрес выбирается при оформлении заказа');

	const pickupText = $derived.by(() => {
		const pickup = data.pickup;
		if (!pickup || pickup.total === 0) return null;
		const points = (n: number) => pluralize(n, ['точке', 'точках', 'точках']);
		if (pickup.withStock === null) {
			return `${pickup.total} ${pluralize(pickup.total, ['точка самовывоза', 'точки самовывоза', 'точек самовывоза'])}`;
		}
		if (pickup.withStock === 0) return 'Сейчас нет в точках самовывоза';
		if (pickup.withStock === pickup.total) {
			return pickup.total === 1 ? 'Есть в точке самовывоза' : 'Есть во всех точках самовывоза';
		}
		return `Есть в ${pickup.withStock} из ${pickup.total} ${points(pickup.total)}`;
	});

	// Галерея: одна лента со снэпом. На телефоне листается пальцем, на десктопе миниатюрами
	let track: HTMLDivElement | undefined = $state();
	let activeImage = $state(0);

	$effect(() => {
		// Открыли другой товар: галерея возвращается к первому фото
		if (product.id && track) {
			track.scrollTo({ left: 0 });
			activeImage = 0;
		}
	});

	function syncActiveImage() {
		if (!track) return;
		activeImage = Math.round(track.scrollLeft / track.clientWidth);
	}

	function showImage(index: number) {
		if (!track) return;
		const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
		track.scrollTo({ left: index * track.clientWidth, behavior: reduceMotion ? 'auto' : 'smooth' });
		activeImage = index;
	}

	// Закреплённая полоса покупки на телефоне видна, пока основная кнопка вне экрана:
	// и до неё (галерея занимает первый экран), и после (читают описание и отзывы)
	let buyRow: HTMLDivElement | undefined = $state();
	let buyRowVisible = $state(true);

	$effect(() => {
		if (!buyRow) return;
		// Нижние вкладки перекрывают низ экрана: кнопка под ними считается невидимой
		const tabbar = parseFloat(getComputedStyle(document.documentElement).fontSize) * 3.5;
		const observer = new IntersectionObserver(
			([entry]) => {
				buyRowVisible = entry.isIntersecting;
			},
			{ rootMargin: `0px 0px -${tabbar}px 0px` }
		);
		observer.observe(buyRow);
		return () => observer.disconnect();
	});

	const siteUrl = $derived(siteOrigin(page.url));
	const siteName = $derived($storeSettings?.name || 'Магазин');
	const productUrl = $derived(`${siteUrl}/products/${product.slug}`);
	// В выдаче видно ~160 символов: длинное описание обрезаем по слову, а не отдаём целиком
	const productDescription = $derived(metaDescription(product.description || product.name));
	const mainImage = $derived(images[0]?.url);

	const breadcrumbs = $derived([
		{ name: 'Главная', url: '/' },
		{ name: 'Каталог', url: '/catalog' },
		...(data.category ? [{ name: data.category.name, url: `/categories/${data.category.slug}` }] : []),
		{ name: product.name, url: `/products/${product.slug}` }
	]);
</script>

<svelte:head>
	<title>{product.name} | {siteName}</title>
	<meta name="description" content={productDescription} />
	<meta property="og:title" content={product.name} />
	<meta property="og:description" content={productDescription} />
	<meta property="og:type" content="product" />
	<meta property="og:url" content={productUrl} />
	{#if mainImage}
		<meta property="og:image" content={mainImage} />
	{/if}
	<meta property="og:site_name" content={siteName} />
	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:title" content={product.name} />
	<meta name="twitter:description" content={productDescription} />
	{#if mainImage}
		<meta name="twitter:image" content={mainImage} />
	{/if}
	<meta property="product:price:amount" content={product.price} />
	<meta property="product:price:currency" content={currency} />
	<link rel="canonical" href={productUrl} />

	<!-- eslint-disable-next-line svelte/no-at-html-tags -- jsonLdScript экранирует <, > и &, закрыть тег script нельзя -->
	{@html jsonLdScript(generateProductJsonLd(product, $storeSettings, siteUrl, { rating: data.rating, reviews: data.reviews }))}
	<!-- eslint-disable-next-line svelte/no-at-html-tags -- jsonLdScript экранирует <, > и &, закрыть тег script нельзя -->
	{@html jsonLdScript(generateBreadcrumbJsonLd(breadcrumbs, siteUrl))}
</svelte:head>

{#snippet price(sizeClass: string)}
	<p class="text-ink {sizeClass}">{formatPrice(product.price, currency)}</p>
{/snippet}

<div class="container py-4 md:py-6">
	<Breadcrumbs items={breadcrumbs.map((crumb) => ({ name: crumb.name, href: crumb.url }))} />

	<h1 class="mt-2 max-w-4xl text-xl leading-tight font-semibold tracking-tight text-balance text-ink md:text-2xl">
		{product.name}
	</h1>
	<div class="mt-2 flex flex-wrap items-center gap-x-5 gap-y-1 text-sm text-gray-500">
		<a href="#reviews" class="inline-flex min-h-8 items-center gap-1.5 hover:text-ink">
			{#if ratingLabel}
				<Star class="size-4 text-ink" fill="currentColor" aria-hidden="true" />
				<span>{ratingLabel}</span>
			{:else}
				Отзывов пока нет
			{/if}
		</a>
		{#if product.sku}
			<span>Артикул <span class="text-gray-700">{product.sku}</span></span>
		{/if}
	</div>

	<div class="mt-4 grid gap-3 lg:grid-cols-[minmax(0,1fr)_23rem] lg:items-start lg:gap-6">
		<!-- Галерея -->
		<section aria-label="Фото товара" class="rounded-2xl bg-surface p-3 md:p-5">
			<!-- Светло-серая подложка; белый фон снимка растворяется в ней через multiply -->
			{#if images.length}
				<div
					bind:this={track}
					onscroll={syncActiveImage}
					class="flex aspect-square snap-x snap-mandatory overflow-x-auto overscroll-x-contain rounded-xl bg-gray-50 [scrollbar-width:none] md:aspect-[4/3]"
				>
					{#each images as image, index (image.url)}
						<img
							src={image.url}
							srcset={image.thumbnailUrl ? `${image.thumbnailUrl} 400w, ${image.url} ${image.width ?? 1600}w` : undefined}
							sizes={image.thumbnailUrl ? '(min-width: 1024px) 50vw, 100vw' : undefined}
							width={image.width ?? undefined}
							height={image.height ?? undefined}
							alt={index === 0 ? product.name : `${product.name}, фото ${index + 1}`}
							loading={index === 0 ? 'eager' : 'lazy'}
							fetchpriority={index === 0 ? 'high' : undefined}
							decoding="async"
							class="size-full shrink-0 snap-center object-contain p-4 mix-blend-multiply md:p-8"
						/>
					{/each}
				</div>

				{#if images.length > 1}
					<div class="mt-3 flex justify-center gap-1.5 md:hidden" aria-hidden="true">
						{#each images as image, index (image.url)}
							<span
								class="h-1.5 rounded-full transition-all duration-200 {index === activeImage
									? 'w-4 bg-ink'
									: 'w-1.5 bg-gray-300'}"
							></span>
						{/each}
					</div>
					<ul class="mt-4 hidden gap-2 md:flex" aria-label="Все фото">
						{#each images as image, index (image.url)}
							<li>
								<button
									type="button"
									onclick={() => showImage(index)}
									aria-label="Показать фото {index + 1} из {images.length}"
									aria-current={index === activeImage ? 'true' : undefined}
									class="size-16 overflow-hidden rounded-xl bg-gray-50 p-1.5 ring-1 transition-shadow {index === activeImage
										? 'ring-2 ring-ink'
										: 'ring-line hover:ring-gray-400'}"
								>
									<img src={image.thumbnailUrl ?? image.url} alt="" loading="lazy" class="size-full object-contain mix-blend-multiply" />
								</button>
							</li>
						{/each}
					</ul>
				{/if}
			{:else}
				<div class="flex aspect-square items-center justify-center rounded-xl bg-gray-50 text-gray-300 md:aspect-[4/3]">
					<ImageOff class="size-16" aria-hidden="true" />
					<span class="sr-only">Фото товара пока нет</span>
				</div>
			{/if}
		</section>

		<!-- Покупка -->
		<aside class="space-y-3 lg:sticky lg:top-4" aria-label="Покупка">
			<div class="rounded-2xl bg-surface p-5">
				{#if discount > 0 && product.compareAtPrice}
					<p class="flex items-center gap-2 text-sm text-gray-500">
						<s>{formatPrice(product.compareAtPrice, currency)}</s>
						<span class="rounded-md bg-ink px-1.5 py-0.5 text-xs font-semibold text-white">−{discount}%</span>
					</p>
				{/if}
				{@render price('text-price-lg')}
				{#if saving > 0}
					<p class="mt-0.5 text-sm text-gray-600">Выгода <span>{formatPrice(saving, currency)}</span></p>
				{/if}

				<StockStatus quantity={product.quantity} class="mt-3 text-sm" />

				<div bind:this={buyRow} class="mt-4 flex gap-2">
					<div class="min-w-0 flex-1">
						<CartControl {product} size="lg" />
					</div>
					<button
						type="button"
						onclick={() => wishlistStore.toggle(product.id)}
						aria-pressed={isFavorite}
						aria-label={isFavorite ? 'Убрать из избранного' : 'Добавить в избранное'}
						class="inline-flex size-13 shrink-0 items-center justify-center rounded-xl bg-gray-100 transition-colors hover:bg-gray-200 {isFavorite
							? 'text-ink'
							: 'text-gray-600'}"
					>
						<Heart class="size-5.5" fill={isFavorite ? 'currentColor' : 'none'} aria-hidden="true" />
					</button>
				</div>

				{#if inCart}
					<a
						href="/cart"
						class="mt-2 flex h-11 animate-swap-in items-center justify-center gap-1 rounded-xl text-sm font-medium text-ink hover:bg-gray-50"
					>
						Перейти в корзину
						<ChevronRight class="size-4" aria-hidden="true" />
					</a>
				{/if}
			</div>

			<ul class="divide-y divide-line rounded-2xl bg-surface px-5 text-sm">
				{#if pickupOn && pickupText}
					<li class="flex gap-3 py-4">
						<Store class="mt-0.5 size-5 shrink-0 text-gray-500" aria-hidden="true" />
						<div>
							<p class="font-medium text-ink">Самовывоз, бесплатно</p>
							<a href="/contacts" class="text-gray-600 underline decoration-gray-300 hover:text-ink hover:decoration-ink">
								{pickupText}
							</a>
						</div>
					</li>
				{/if}
				{#if deliveryOn}
					<li class="flex gap-3 py-4">
						<Truck class="mt-0.5 size-5 shrink-0 text-gray-500" aria-hidden="true" />
						<div>
							<p class="font-medium text-ink">Доставка курьером</p>
							<p class="text-gray-600">{deliveryText}</p>
						</div>
					</li>
				{/if}
				<li class="flex gap-3 py-4">
					<Wallet class="mt-0.5 size-5 shrink-0 text-gray-500" aria-hidden="true" />
					<div>
						<p class="font-medium text-ink">Оплата при получении</p>
						<p class="text-gray-600">Предоплата не нужна</p>
					</div>
				</li>
			</ul>
		</aside>
	</div>

	<div class="mt-3 grid gap-3 lg:mt-6 lg:grid-cols-[minmax(0,1fr)_23rem] lg:gap-6">
		<div class="min-w-0 space-y-3 lg:space-y-6">
			{#if attributes.length > 0}
				<section aria-labelledby="attributes-title" class="rounded-2xl bg-surface p-5 md:p-6">
					<h2 id="attributes-title" class="text-title text-ink">Характеристики</h2>
					<dl class="mt-3 max-w-[40rem] divide-y divide-line">
						{#each attributes as attribute (attribute.id)}
							<div class="grid grid-cols-[minmax(0,2fr)_minmax(0,3fr)] gap-4 py-2.5 text-body-sm">
								<dt class="break-words text-gray-600">{attribute.name}</dt>
								<dd class="break-words text-gray-900">
									{attribute.value}{#if attribute.unit}&nbsp;{attribute.unit}{/if}
								</dd>
							</div>
						{/each}
					</dl>
				</section>
			{/if}

			{#if product.description}
				<section aria-labelledby="description-title" class="rounded-2xl bg-surface p-5 md:p-6">
					<h2 id="description-title" class="text-title text-ink">Описание</h2>
					<p class="mt-3 max-w-[36rem] text-body text-pretty break-words whitespace-pre-line text-gray-700">{product.description}</p>
				</section>
			{/if}

			<section id="reviews" class="scroll-mt-4 rounded-2xl bg-surface p-5 md:p-6">
				{#key product.id}
					<ProductReviews productId={product.id} initialReviews={data.reviews} />
				{/key}
			</section>
		</div>
	</div>
</div>

<!-- Закреплённая полоса покупки (телефон) -->
<div
	class="fixed inset-x-0 bottom-[calc(var(--tabbar-height)+env(safe-area-inset-bottom))] z-30 border-t border-line bg-surface px-4 py-2.5 transition-transform duration-300 ease-out-quart md:hidden {buyRowVisible
		? 'pointer-events-none translate-y-[calc(100%+var(--tabbar-height))]'
		: 'translate-y-0'}"
	aria-hidden={buyRowVisible}
	inert={buyRowVisible}
>
	<div class="flex items-center gap-3">
		<div class="min-w-0 flex-1">
			{#if discount > 0 && product.compareAtPrice}
				<p class="text-xs text-gray-500"><s>{formatPrice(product.compareAtPrice, currency)}</s></p>
			{/if}
			{@render price('text-price-md leading-tight')}
		</div>
		<div class="w-40 shrink-0 min-[360px]:w-44">
			<CartControl {product} />
		</div>
	</div>
</div>
