<script lang="ts">
	import type { CartItem } from '$lib/types/cart';
	import { formatPrice } from '$lib/utils/format';
	import { storeSettings } from '$lib/stores/store';

	interface Props {
		item: CartItem;
		onUpdateQuantity: (itemId: number, quantity: number) => void;
		onRemove: (itemId: number) => void;
		isUpdating?: boolean;
	}

	let { item, onUpdateQuantity, onRemove, isUpdating = false }: Props = $props();

	let localQuantity = $state(item.quantity);
	let isChanging = $state(false);

	async function handleQuantityChange(newQuantity: number) {
		if (newQuantity < 1) {
			newQuantity = 1;
		}
		if (newQuantity > item.product.quantity) {
			newQuantity = item.product.quantity;
		}

		localQuantity = newQuantity;
		isChanging = true;

		try {
			await onUpdateQuantity(item.id, newQuantity);
		} finally {
			isChanging = false;
		}
	}

	function handleRemove() {
		if (confirm('Удалить товар из корзины?')) {
			onRemove(item.id);
		}
	}
</script>

<div class="flex items-center space-x-4 p-4 bg-white rounded-lg shadow-md">
	<!-- Изображение -->
	<a href="/products/{item.product.slug}" class="flex-shrink-0">
		<div class="w-20 h-20 bg-gray-100 rounded overflow-hidden">
			{#if item.product.images && item.product.images.length > 0}
				<img
					src={item.product.images[0].url}
					alt={item.product.name}
					class="w-full h-full object-cover"
				/>
			{:else}
				<div class="w-full h-full flex items-center justify-center text-gray-400">
					<svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
	</a>

	<!-- Информация о товаре -->
	<div class="flex-1 min-w-0">
		<a href="/products/{item.product.slug}" class="block">
			<h3 class="text-lg font-semibold text-gray-800 hover:text-blue-600 transition-colors">
				{item.product.name}
			</h3>
		</a>
		{#if item.product.category}
			<p class="text-sm text-gray-500">{item.product.category.name}</p>
		{/if}
		<p class="text-lg font-bold text-gray-900 mt-2">
			{formatPrice(item.product.price, $storeSettings?.currency || 'RUB')}
		</p>
	</div>

	<!-- Количество и действия -->
	<div class="flex items-center space-x-4">
		<!-- Изменение количества -->
		<div class="flex items-center border border-gray-300 rounded">
			<button
				onclick={() => handleQuantityChange(localQuantity - 1)}
				disabled={isChanging || isUpdating || localQuantity <= 1}
				class="px-3 py-2 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
			>
				−
			</button>
			<input
				type="number"
				bind:value={localQuantity}
				min="1"
				max={item.product.quantity}
				onchange={(e) => handleQuantityChange(parseInt(e.currentTarget.value) || 1)}
				disabled={isChanging || isUpdating}
				class="w-16 text-center border-0 focus:outline-none disabled:opacity-50"
			/>
			<button
				onclick={() => handleQuantityChange(localQuantity + 1)}
				disabled={isChanging || isUpdating || localQuantity >= item.product.quantity}
				class="px-3 py-2 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
			>
				+
			</button>
		</div>

		<!-- Итоговая цена -->
		<div class="text-right min-w-[100px]">
			<p class="text-lg font-bold text-gray-900">
				{formatPrice(
					(parseFloat(item.product.price) * localQuantity).toFixed(2),
					$storeSettings?.currency || 'RUB'
				)}
			</p>
		</div>

		<!-- Удаление -->
		<button
			onclick={handleRemove}
			disabled={isUpdating}
			class="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded transition-colors disabled:opacity-50"
			aria-label="Удалить товар"
		>
			<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="2"
					d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
				/>
			</svg>
		</button>
	</div>
</div>
