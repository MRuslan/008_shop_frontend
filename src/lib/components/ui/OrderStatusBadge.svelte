<script lang="ts">
	import type { DeliveryType, OrderStatus } from '$lib/types/order';
	import { orderStatusLabel, ORDER_STATUS_DOT } from '$lib/utils/order-status';

	// Статус заказа: слово и точка на нейтральной плашке, одинаково в кабинете и админке
	interface Props {
		status: OrderStatus;
		deliveryType?: DeliveryType;
		class?: string;
	}

	let { status, deliveryType, class: className = '' }: Props = $props();
</script>

<span
	class="inline-flex items-center gap-1.5 rounded-full bg-gray-100 px-2.5 py-1 text-label font-medium whitespace-nowrap text-gray-800 {className}"
>
	<span class="size-1.5 shrink-0 rounded-full {ORDER_STATUS_DOT[status]}" aria-hidden="true"></span>
	{orderStatusLabel(status, deliveryType)}
</span>
