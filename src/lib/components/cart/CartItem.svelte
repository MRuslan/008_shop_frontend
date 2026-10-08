<script lang="ts">
	import type { CartItem } from '$lib/types/cart';
	import { formatPrice } from '$lib/utils/format';
	import { storeSettings } from '$lib/stores/store';
	import Minus from '@lucide/svelte/icons/minus';
	import Plus from '@lucide/svelte/icons/plus';
	import Trash2 from '@lucide/svelte/icons/trash-2';
	import ImageOff from '@lucide/svelte/icons/image-off';

	interface Props {
		item: CartItem;
		onUpdateQuantity: (itemId: number, quantity: number) => void | Promise<void>;
		onRemove: (itemId: number) => void;
		isUpdating?: boolean;
	}

	let { item, onUpdateQuantity, onRemove, isUpdating = false }: Props = $props();

	// Writable derived: локальное значение, которое сервер может перезаписать (например, урезав до остатка)
	let localQuantity = $derived(item.quantity);
	let isChanging = $state(false);

	const inputId = $props.id();
	const currency = $derived($storeSettings?.currency || 'RUB');
	const cover = $derived(item.product.images?.[0]);

	async function handleQuantityChange(newQuantity: number) {
		if (!Number.isFinite(newQuantity) || newQuantity < 1) {
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

	// Без подтверждения: удаление из корзины обратимо, страница корзины предлагает «Вернуть»
	function handleRemove() {
		onRemove(item.id);
	}

	const stepButton =
		'inline-flex h-full min-w-11 items-center justify-center rounded-xl transition-colors hover:bg-gray-200 disabled:cursor-not-allowed disabled:text-gray-400 disabled:hover:bg-transparent';
</script>

<!-- На узких экранах управление переносится под описание, на широких остаётся справа -->
<div class="flex flex-wrap items-start gap-x-4 gap-y-3 rounded-2xl bg-surface p-4 sm:p-5">
	<!-- Фото на светлом колодце, как в каталоге: белый фон снимка растворяется -->
	<a href="/products/{item.product.slug}" class="shrink-0" tabindex="-1" aria-hidden="true">
		<div class="flex size-20 items-center justify-center overflow-hidden rounded-xl bg-gray-50">
			{#if cover}
				<img
					src={cover.thumbnailUrl ?? cover.url}
					alt=""
					width="80"
					height="80"
					class="size-full object-contain p-1.5 mix-blend-multiply"
					loading="lazy"
				/>
			{:else}
				<ImageOff class="size-7 text-gray-300" aria-hidden="true" />
			{/if}
		</div>
	</a>

	<!-- Информация о товаре -->
	<div class="min-w-[10rem] flex-1">
		<a href="/products/{item.product.slug}" class="block">
			<h3 class="line-clamp-2 text-body-sm break-words text-gray-800 transition-colors hover:text-ink sm:text-body">
				{item.product.name}
			</h3>
		</a>
		{#if item.product.category}
			<p class="text-body-sm text-gray-500">{item.product.category.name}</p>
		{/if}
		<p class="mt-1 text-body-sm text-gray-600">
			{formatPrice(item.product.price, currency)} за&nbsp;шт.
		</p>
	</div>

	<!-- Количество, сумма строки и удаление -->
	<div class="flex w-full items-center justify-between gap-3 sm:w-auto sm:justify-end">
		<!-- Тот же степпер, что на карточке товара: серая подложка, «−» и «+» по краям -->
		<div
			class="flex h-11 items-center rounded-xl bg-gray-100 text-gray-900 aria-busy:opacity-70"
			role="group"
			aria-label="Количество: {item.product.name}"
			aria-busy={isChanging}
		>
			<button
				type="button"
				onclick={() => handleQuantityChange(localQuantity - 1)}
				disabled={isChanging || isUpdating || localQuantity <= 1}
				aria-label="Уменьшить количество"
				class={stepButton}
			>
				<Minus class="size-4" aria-hidden="true" />
			</button>
			<input
				id={inputId}
				type="number"
				bind:value={localQuantity}
				min="1"
				max={item.product.quantity}
				inputmode="numeric"
				aria-label="Количество"
				onchange={(e) => handleQuantityChange(parseInt(e.currentTarget.value) || 1)}
				disabled={isChanging || isUpdating}
				class="h-full w-11 [appearance:textfield] bg-transparent text-center text-base font-semibold tabular-nums focus:rounded-lg focus:bg-surface focus:ring-2 focus:ring-ink focus:outline-none disabled:opacity-60 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
			/>
			<button
				type="button"
				onclick={() => handleQuantityChange(localQuantity + 1)}
				disabled={isChanging || isUpdating || localQuantity >= item.product.quantity}
				aria-label={localQuantity >= item.product.quantity
					? `Больше нет в наличии, всего ${item.product.quantity} шт.`
					: 'Увеличить количество'}
				class={stepButton}
			>
				<Plus class="size-4" aria-hidden="true" />
			</button>
		</div>

		<p class="text-right text-price text-ink sm:min-w-[6rem]">
			{formatPrice((parseFloat(item.product.price) * localQuantity).toFixed(2), currency)}
		</p>

		<button
			type="button"
			onclick={handleRemove}
			disabled={isUpdating}
			class="inline-flex size-11 shrink-0 items-center justify-center rounded-xl text-gray-600 transition-colors hover:bg-negative/8 hover:text-negative disabled:opacity-50"
			aria-label="Удалить «{item.product.name}» из корзины"
		>
			<Trash2 class="size-4.5" aria-hidden="true" />
		</button>
	</div>
</div>
