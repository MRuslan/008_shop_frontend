<script lang="ts">
	import type { Product } from '$lib/types/product';
	import ProductCard from './ProductCard.svelte';

	interface Props {
		products: Product[];
		/** Сколько колонок на широком экране: 4 без боковой панели, 3 рядом с фильтрами */
		columns?: 3 | 4;
	}

	let { products, columns = 4 }: Props = $props();
</script>

<ul
	class="grid grid-cols-2 gap-2 sm:gap-3 md:grid-cols-3 {columns === 4 ? 'xl:grid-cols-4' : ''}"
	aria-label="Товары"
>
	{#each products as product, index (product.id)}
		<li>
			<ProductCard {product} eager={index < 4} priority={index < 2} />
		</li>
	{/each}
</ul>
