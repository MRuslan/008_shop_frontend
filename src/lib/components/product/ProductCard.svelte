<script lang="ts">
	import type { Product } from '$lib/types/product';
	import { formatPrice } from '$lib/utils/format';
	import { storeSettings } from '$lib/stores/store';

	interface Props {
		product: Product;
	}

	let { product }: Props = $props();
</script>

<a
	href="/products/{product.slug}"
	class="block bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow overflow-hidden"
>
	<!-- Изображение -->
	<div class="aspect-square bg-gray-100 overflow-hidden">
		{#if product.images && product.images.length > 0}
			<img
				src={product.images[0].url}
				alt={product.name}
				class="w-full h-full object-cover"
				loading="lazy"
			/>
		{:else}
			<div class="w-full h-full flex items-center justify-center text-gray-400">
				<svg class="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
					/>
				</svg>
			</div>
		{/if}
	</div>

	<!-- Информация -->
	<div class="p-4">
		<h3 class="text-lg font-semibold text-gray-800 mb-2 line-clamp-2">
			{product.name}
		</h3>
		
		{#if product.category}
			<p class="text-sm text-gray-500 mb-2">{product.category.name}</p>
		{/if}

		<!-- Цена -->
		<div class="flex items-center space-x-2 mb-2">
			<span class="text-xl font-bold text-gray-900">
				{formatPrice(product.price, $storeSettings?.currency || 'RUB')}
			</span>
			{#if product.compareAtPrice && parseFloat(product.compareAtPrice) > parseFloat(product.price)}
				<span class="text-sm text-gray-500 line-through">
					{formatPrice(product.compareAtPrice, $storeSettings?.currency || 'RUB')}
				</span>
			{/if}
		</div>

		<!-- Наличие -->
		<div class="flex items-center justify-between">
			{#if product.quantity > 0}
				<span class="text-sm text-green-600 font-medium">В наличии</span>
			{:else}
				<span class="text-sm text-red-600 font-medium">Нет в наличии</span>
			{/if}
		</div>
	</div>
</a>
