<script lang="ts">
	import type { Product } from '$lib/types/product';
	import ProductCard from './ProductCard.svelte';

	interface Props {
		products: Product[];
	}

	let { products }: Props = $props();
</script>

{#if products.length === 0}
	<div class="text-center py-12">
		<p class="text-gray-500 text-lg">Товары не найдены</p>
	</div>
{:else}
	<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
		{#each products as product (product.id)}
			<ProductCard {product} />
		{/each}
	</div>
{/if}
