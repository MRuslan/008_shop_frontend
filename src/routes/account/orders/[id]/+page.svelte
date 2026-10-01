<script lang="ts">
	import { invalidateAll } from '$app/navigation';
	import { ordersApi } from '$lib/api/orders';
	import type { Order, OrderStatusHistory } from '$lib/types/order';
	import { formatPrice, formatDateTime } from '$lib/utils/format';
	import {
		orderStatusLabel,
		orderNextStep,
		canCustomerCancel,
		ORDER_STATUS_TONE
	} from '$lib/utils/order-status';
	import { getErrorMessage } from '$lib/utils/errors';
	import { storeSettings } from '$lib/stores/store';
	import { toast } from '$lib/stores/toast';
	import { authStore } from '$lib/stores/auth';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	const currency = $derived($storeSettings?.currency || 'RUB');

	// Отмена раскрывается на месте: причина необязательна, магазин получит её в письме
	let cancelOpen = $state(false);
	let cancelReason = $state('');
	let cancelling = $state(false);

	async function cancelOrder(order: Order) {
		if (cancelling) return;
		cancelling = true;
		try {
			await ordersApi.cancelOrder(order.id, cancelReason.trim() || undefined);
			await invalidateAll();
			cancelOpen = false;
			toast.success(`Заказ №${order.id} отменён`);
		} catch (err) {
			toast.error(getErrorMessage(err, 'Не удалось отменить заказ. Обновите страницу и попробуйте ещё раз.'));
		} finally {
			cancelling = false;
		}
	}

	// Сумма товаров до скидки; у старых заказов её нет, тогда восстанавливаем из позиций
	function subtotalOf(order: Order): string {
		if (order.subtotalAmount) return order.subtotalAmount;
		return order.items.reduce((sum, item) => sum + parseFloat(item.price) * item.quantity, 0).toFixed(2);
	}

	function historyLabel(entry: OrderStatusHistory, order: Order): string {
		if (entry.fromStatus === null) return 'Заказ оформлен';
		if (entry.toStatus === 'cancelled' && entry.changedByUserId === order.userId) return 'Вы отменили заказ';
		return orderStatusLabel(entry.toStatus, order.deliveryType);
	}
</script>

<svelte:head>
	<title>Заказ №{data.order?.id ?? ''} — Личный кабинет</title>
	<meta name="robots" content="noindex" />
</svelte:head>

{#if data.order}
	{@const order = data.order}
	{@const history = [...(order.statusHistory ?? [])].sort((a, b) => a.createAt.localeCompare(b.createAt))}
	{@const deliveryCost = parseFloat(order.deliveryCost ?? '0')}
	<div class="space-y-6">
		<!-- Заголовок -->
		<div class="bg-white rounded-lg shadow-md p-6">
			<div class="flex flex-wrap items-center justify-between gap-3 mb-2">
				<h1 class="text-headline text-ink">Заказ №{order.id}</h1>
				<span class="px-3 py-1 rounded-full text-label font-medium {ORDER_STATUS_TONE[order.status]}">
					{orderStatusLabel(order.status, order.deliveryType)}
				</span>
			</div>

			<p class="mb-4 text-gray-700">
				{orderNextStep(order.status, order.deliveryType)}
				{#if order.status === 'cancelled'}
					Если это ошибка, <a href="/contacts" class="underline underline-offset-4">свяжитесь с магазином</a>.
				{/if}
			</p>

			<dl class="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
				<div>
					<dt class="text-gray-500">Оформлен</dt>
					<dd class="text-gray-900">{formatDateTime(order.createAt)}</dd>
				</div>
				<div>
					<dt class="text-gray-500">Получение</dt>
					<dd class="text-gray-900">
						{order.deliveryType === 'delivery' ? 'Доставка курьером' : 'Самовывоз'}
					</dd>
				</div>
			</dl>

			<!-- Сотрудник открывает чужой заказ по ссылке из админки: отменять его здесь нельзя -->
			{#if canCustomerCancel(order.status) && $authStore.user?.id === order.userId}
				<div class="mt-5 border-t border-gray-200 pt-4">
					{#if !cancelOpen}
						<button
							type="button"
							onclick={() => (cancelOpen = true)}
							class="inline-flex h-11 items-center rounded-xl px-1 text-control text-negative underline-offset-4 hover:underline"
						>
							Отменить заказ
						</button>
					{:else}
						<form
							onsubmit={(event) => {
								event.preventDefault();
								cancelOrder(order);
							}}
							class="space-y-3"
						>
							<label for="cancel-reason" class="block text-body-sm text-gray-700">
								Почему отменяете? <span class="text-gray-500">Необязательно, магазин увидит ответ.</span>
							</label>
							<textarea
								id="cancel-reason"
								bind:value={cancelReason}
								rows="2"
								maxlength="1000"
								placeholder="Например: оформил по ошибке"
								class="w-full rounded-xl border border-gray-300 px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-ink"
							></textarea>
							<div class="flex flex-wrap gap-2">
								<button
									type="submit"
									aria-busy={cancelling}
									class="inline-flex h-11 items-center rounded-xl bg-negative px-5 text-control text-white aria-busy:opacity-70"
								>
									{cancelling ? 'Отменяем…' : 'Отменить заказ'}
								</button>
								<button
									type="button"
									onclick={() => (cancelOpen = false)}
									class="inline-flex h-11 items-center rounded-xl bg-gray-100 px-5 text-control text-gray-900 hover:bg-gray-200"
								>
									Не отменять
								</button>
							</div>
						</form>
					{/if}
				</div>
			{/if}
		</div>

		<!-- Товары -->
		<div class="bg-white rounded-lg shadow-md p-6">
			<h2 class="text-title text-ink mb-4">Товары в заказе</h2>
			<div class="space-y-4">
				{#each order.items as item (item.id)}
					<div class="flex items-center space-x-4 pb-4 border-b border-gray-200 last:border-0">
						<div class="flex-1">
							{#if item.product?.slug}
								<a
									href="/products/{item.product.slug}"
									class="line-clamp-2 text-body-sm sm:text-body text-gray-800 hover:text-ink"
								>
									{item.productName}
								</a>
							{:else}
								<!-- Товар сняли с продажи: название и цена сохранились в заказе -->
								<p class="line-clamp-2 text-body-sm sm:text-body text-gray-800">{item.productName}</p>
							{/if}
							<p class="text-sm text-gray-600">
								{item.quantity}&nbsp;шт. × {formatPrice(item.price, currency)}
							</p>
						</div>
						<p class="text-right text-price text-ink">
							{formatPrice((parseFloat(item.price) * item.quantity).toFixed(2), currency)}
						</p>
					</div>
				{/each}
			</div>
		</div>

		<!-- Информация о доставке -->
		{#if order.deliveryType === 'delivery' && order.deliveryAddressSnapshot}
			<div class="bg-white rounded-lg shadow-md p-6">
				<h2 class="text-title text-ink mb-4">Адрес доставки</h2>
				<div class="text-sm text-gray-600 space-y-1">
					<p>{order.deliveryAddressSnapshot.label}</p>
					<p>
						{order.deliveryAddressSnapshot.city}, {order.deliveryAddressSnapshot.street}, д. {order.deliveryAddressSnapshot.building}
						{#if order.deliveryAddressSnapshot.apartment}, кв. {order.deliveryAddressSnapshot.apartment}{/if}
					</p>
					{#if order.deliveryAddressSnapshot.postalCode}
						<p>Индекс: {order.deliveryAddressSnapshot.postalCode}</p>
					{/if}
					<p>Телефон для связи: {order.deliveryAddressSnapshot.phone}</p>
				</div>
			</div>
		{:else if order.deliveryType === 'pickup' && order.pickupLocation}
			<div class="bg-white rounded-lg shadow-md p-6">
				<h2 class="text-title text-ink mb-4">Точка самовывоза</h2>
				<div class="text-sm text-gray-600 space-y-1">
					<p class="font-medium text-gray-800">{order.pickupLocation.name}</p>
					<p>
						{order.pickupLocation.city}, {order.pickupLocation.street}, д. {order.pickupLocation.building}
						{#if order.pickupLocation.apartment}, {order.pickupLocation.apartment}{/if}
					</p>
					<p>Телефон точки: {order.pickupLocation.phone}</p>
				</div>
			</div>
		{/if}

		<!-- Итого -->
		<div class="bg-white rounded-lg shadow-md p-6">
			<h2 class="text-title text-ink mb-4">Итого</h2>
			<div class="space-y-2">
				<div class="flex justify-between text-gray-600">
					<span>Товары</span>
					<span>{formatPrice(subtotalOf(order), currency)}</span>
				</div>
				{#if order.discountAmount && parseFloat(order.discountAmount) > 0}
					<div class="flex justify-between text-positive">
						<span>Скидка{#if order.couponCode} по промокоду {order.couponCode}{/if}</span>
						<span>−{formatPrice(order.discountAmount, currency)}</span>
					</div>
				{/if}
				{#if order.deliveryType === 'delivery'}
					<div class="flex justify-between text-gray-600">
						<span>Доставка</span>
						<span>{deliveryCost > 0 ? formatPrice(order.deliveryCost ?? '0', currency) : 'Бесплатно'}</span>
					</div>
				{/if}
				<div class="flex items-baseline justify-between text-ink border-t pt-2">
					<span class="text-title-sm">
						{['pending', 'confirmed', 'shipped'].includes(order.status) ? 'К оплате при получении' : 'Сумма заказа'}
					</span>
					<span class="text-price-md">{formatPrice(order.totalAmount, currency)}</span>
				</div>
			</div>
		</div>

		<!-- Комментарий -->
		{#if order.comment}
			<div class="bg-white rounded-lg shadow-md p-6">
				<h2 class="text-title text-ink mb-4">Комментарий к заказу</h2>
				<p class="text-sm text-gray-600">{order.comment}</p>
			</div>
		{/if}

		<!-- История статусов: что и когда происходило с заказом -->
		{#if history.length > 1}
			<div class="bg-white rounded-lg shadow-md p-6">
				<h2 class="text-title text-ink mb-4">История заказа</h2>
				<ol class="space-y-3">
					{#each history as entry (entry.id)}
						<li class="flex flex-col gap-0.5 sm:flex-row sm:gap-4">
							<time datetime={entry.createAt} class="shrink-0 text-body-sm text-gray-500 tabular-nums sm:w-40">
								{formatDateTime(entry.createAt)}
							</time>
							<div>
								<p class="text-body-sm text-gray-900">{historyLabel(entry, order)}</p>
								{#if entry.comment}
									<p class="text-body-sm text-gray-600">{entry.comment}</p>
								{/if}
							</div>
						</li>
					{/each}
				</ol>
			</div>
		{/if}
	</div>
{/if}
