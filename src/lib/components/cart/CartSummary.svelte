<script lang="ts">
	import type { Cart } from '$lib/types/cart';
	import { formatPrice } from '$lib/utils/format';
	import { storeSettings } from '$lib/stores/store';
	import { cartTotal } from '$lib/stores/cart';

	interface Props {
		cart: Cart;
	}

	let { cart }: Props = $props();
</script>

<div class="bg-white rounded-lg shadow-md p-6">
	<h2 class="text-xl font-bold text-gray-800 mb-4">Итого</h2>

	<div class="space-y-2 mb-4">
		<div class="flex justify-between text-gray-600">
			<span>Товаров:</span>
			<span>{cart.items.length}</span>
		</div>
		<div class="flex justify-between text-gray-600">
			<span>Количество:</span>
			<span>{cart.items.reduce((sum, item) => sum + item.quantity, 0)} шт.</span>
		</div>
	</div>

	<div class="border-t pt-4 mb-4">
		<div class="flex justify-between text-xl font-bold text-gray-900">
			<span>Сумма:</span>
			<span>
				{formatPrice($cartTotal, $storeSettings?.currency || 'RUB')}
			</span>
		</div>
	</div>

	<a
		href="/checkout"
		class="block w-full bg-blue-600 text-white text-center py-3 px-6 rounded-lg font-medium hover:bg-blue-700 transition-colors"
	>
		Оформить заказ
	</a>
</div>
