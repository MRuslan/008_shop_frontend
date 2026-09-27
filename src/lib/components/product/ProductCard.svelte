<script lang="ts">
	import type { Product } from '$lib/types/product';
	import { formatPrice, discountPercent } from '$lib/utils/format';
	import { storeSettings } from '$lib/stores/store';
	import { wishlistStore } from '$lib/stores/wishlist';
	import CartControl from './CartControl.svelte';
	import StockStatus from './StockStatus.svelte';
	import Heart from '@lucide/svelte/icons/heart';
	import ImageOff from '@lucide/svelte/icons/image-off';

	interface Props {
		product: Product;
		/** Первые карточки видны без прокрутки: грузим их фото сразу */
		eager?: boolean;
		/** Первый ряд на телефоне: его фото — кандидат в LCP, просим браузер грузить его первым */
		priority?: boolean;
	}

	let { product, eager = false, priority = false }: Props = $props();

	const currency = $derived($storeSettings?.currency || 'RUB');
	const image = $derived(product.images?.[0]?.url);
	const discount = $derived(discountPercent(product.price, product.compareAtPrice));
	const inStock = $derived(product.quantity > 0);
	const isFavorite = $derived($wishlistStore.has(product.id));
</script>

<article
	class="group relative flex h-full flex-col rounded-2xl bg-surface p-2.5 transition-shadow duration-200 hover:shadow-[0_4px_16px_rgb(0_0_0/0.06)] has-[a:focus-visible]:outline-2 has-[a:focus-visible]:outline-offset-2 has-[a:focus-visible]:outline-ink sm:p-3"
>
	<div class="relative aspect-square overflow-hidden rounded-xl bg-gray-50">
		{#if image}
			<img
				src={image}
				alt=""
				loading={eager ? 'eager' : 'lazy'}
				fetchpriority={priority ? 'high' : undefined}
				decoding="async"
				class="size-full object-contain p-3 mix-blend-multiply {inStock
					? ''
					: 'opacity-50 grayscale'}"
			/>
		{:else}
			<div class="flex size-full items-center justify-center bg-gray-50 text-gray-300">
				<ImageOff class="size-10" aria-hidden="true" />
			</div>
		{/if}

		<button
			type="button"
			onclick={() => wishlistStore.toggle(product.id)}
			aria-pressed={isFavorite}
			aria-label={isFavorite ? `Убрать «${product.name}» из избранного` : `Добавить «${product.name}» в избранное`}
			class="absolute top-0 right-0 z-10 inline-flex size-11 items-center justify-center rounded-full transition-colors {isFavorite
				? 'text-ink'
				: 'text-gray-500 hover:text-ink'}"
		>
			<Heart class="size-5" fill={isFavorite ? 'currentColor' : 'none'} aria-hidden="true" />
		</button>
	</div>

	<div class="mt-2.5 flex flex-1 flex-col">
		<p class="flex h-5 items-center gap-1.5 text-label text-gray-500">
			{#if discount > 0 && product.compareAtPrice}
				<s>{formatPrice(product.compareAtPrice, currency)}</s>
				<span class="rounded-md bg-ink px-1.5 py-0.5 font-semibold text-white">−{discount}%</span>
			{/if}
		</p>
		<p class="text-price text-ink sm:text-price-md">
			{formatPrice(product.price, currency)}
		</p>

		<h2 class="mt-1 text-sm leading-5 text-gray-800">
			<a
				href="/products/{product.slug}"
				class="line-clamp-2 break-words outline-none after:absolute after:inset-0 after:rounded-2xl after:content-[''] group-hover:text-ink"
			>
				{product.name}
			</a>
		</h2>

		<StockStatus quantity={product.quantity} class="mt-1.5 text-label" />

		<div class="relative z-10 mt-auto pt-3">
			<CartControl {product} />
		</div>
	</div>
</article>
