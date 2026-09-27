<script lang="ts">
	import { tick } from 'svelte';
	import type { Product } from '$lib/types/product';
	import { cartStore, cartLines } from '$lib/stores/cart';
	import { toast } from '$lib/stores/toast';
	import { getErrorMessage } from '$lib/utils/errors';
	import ShoppingCart from '@lucide/svelte/icons/shopping-cart';
	import Minus from '@lucide/svelte/icons/minus';
	import Plus from '@lucide/svelte/icons/plus';

	interface Props {
		product: Product;
		size?: 'md' | 'lg';
	}

	let { product, size = 'md' }: Props = $props();

	const line = $derived($cartLines.get(product.id));
	const inStock = $derived(product.quantity > 0);
	const atLimit = $derived(!!line && line.quantity >= product.quantity);

	let pending = $state(false);
	let addButton: HTMLButtonElement | undefined = $state();
	let plusButton: HTMLButtonElement | undefined = $state();

	const height = $derived(size === 'lg' ? 'h-13 text-control-lg' : 'h-11 text-control');

	async function add() {
		if (pending) return;
		pending = true;
		try {
			await cartStore.add(product.id, 1);
			// Кнопка превратилась в степпер: фокус переезжает на «+», чтобы клавиатура не теряла место
			await tick();
			plusButton?.focus();
		} catch (err) {
			toast.error(getErrorMessage(err, 'Не удалось добавить товар в корзину'));
		} finally {
			pending = false;
		}
	}

	async function change(delta: number) {
		if (pending || !line) return;
		const next = line.quantity + delta;
		pending = true;
		try {
			await cartStore.setQuantity(line.itemId, next);
			if (next <= 0) {
				await tick();
				addButton?.focus();
			}
		} catch (err) {
			toast.error(getErrorMessage(err, 'Не удалось изменить количество'));
		} finally {
			pending = false;
		}
	}
</script>

{#if !inStock}
	<button
		type="button"
		disabled
		class="flex w-full items-center justify-center rounded-xl bg-gray-100 font-medium text-gray-500 {height}"
	>
		Нет в наличии
	</button>
{:else if !line}
	<button
		type="button"
		bind:this={addButton}
		onclick={add}
		aria-busy={pending}
		class="flex w-full animate-swap-in items-center justify-center gap-2 rounded-xl bg-ink font-medium text-white transition-colors duration-150 hover:bg-ink-hover active:scale-[0.98] aria-busy:opacity-70 {height}"
	>
		<ShoppingCart class="size-[1.15em]" aria-hidden="true" />
		{size === 'lg' ? 'Добавить в корзину' : 'В корзину'}
	</button>
{:else}
	<div
		role="group"
		aria-label="Количество в корзине: {product.name}"
		aria-busy={pending}
		class="flex w-full animate-swap-in items-center justify-between rounded-xl bg-gray-100 text-gray-900 aria-busy:opacity-70 {height}"
	>
		<button
			type="button"
			onclick={() => change(-1)}
			aria-label={line.quantity === 1 ? 'Убрать из корзины' : 'Уменьшить количество'}
			class="inline-flex h-full min-w-11 items-center justify-center rounded-xl transition-colors hover:bg-gray-200"
		>
			<Minus class="size-4" aria-hidden="true" />
		</button>
		<span class="font-semibold tabular-nums" aria-live="polite">
			{line.quantity}<span class="sr-only">&nbsp;шт. в корзине</span>
		</span>
		<button
			type="button"
			bind:this={plusButton}
			onclick={() => change(1)}
			disabled={atLimit}
			aria-label={atLimit ? `Больше нет в наличии, всего ${product.quantity} шт.` : 'Увеличить количество'}
			class="inline-flex h-full min-w-11 items-center justify-center rounded-xl transition-colors hover:bg-gray-200 disabled:cursor-not-allowed disabled:text-gray-400 disabled:hover:bg-transparent"
		>
			<Plus class="size-4" aria-hidden="true" />
		</button>
	</div>
{/if}
