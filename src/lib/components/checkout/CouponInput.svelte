<script lang="ts">
	interface Props {
		couponCode: string | null;
		/**
		 * Что известно о промокоде после предрасчёта:
		 * checking — идёт проверка, applied — скидка есть, rejected — не подходит,
		 * unchecked — проверить заранее нельзя, сервер проверит при оформлении
		 */
		status: 'checking' | 'applied' | 'rejected' | 'unchecked';
		/** Готовая сумма скидки для показа, например «−200 ₽» */
		discountLabel?: string | null;
		/** Почему промокод не подошёл, текст с сервера */
		rejection?: string | null;
		onApply: (code: string) => void;
		onRemove: () => void;
	}

	let { couponCode, status, discountLabel = null, rejection = null, onApply, onRemove }: Props = $props();

	const inputId = $props.id();

	let inputCode = $state('');
	let error = $state<string | null>(null);

	function handleApply() {
		if (!inputCode.trim()) {
			error = 'Введите промокод.';
			return;
		}
		error = null;
		onApply(inputCode.trim().toUpperCase());
		inputCode = '';
	}
</script>

<div class="space-y-2">
	<label for={inputId} class="block text-sm font-medium text-gray-700">Промокод</label>

	{#if couponCode}
		<div
			class="flex items-center justify-between gap-3 rounded-md border p-3 {status === 'rejected'
				? 'border-red-200 bg-red-50'
				: 'border-gray-200 bg-gray-50'}"
		>
			<div aria-live="polite">
				<p class="text-sm font-medium text-gray-900">{couponCode}</p>
				{#if status === 'checking'}
					<p class="text-sm text-gray-600">Проверяем промокод…</p>
				{:else if status === 'applied'}
					<p class="text-sm text-positive">
						{discountLabel ? `Скидка ${discountLabel}` : 'Промокод применён'}
					</p>
				{:else if status === 'rejected'}
					<p class="text-sm text-negative">{rejection ?? 'Промокод не подходит к этому заказу.'}</p>
				{:else}
					<p class="text-sm text-gray-600">Проверим и применим при оформлении заказа</p>
				{/if}
			</div>
			<button
				type="button"
				onclick={onRemove}
				class="inline-flex min-h-11 items-center rounded-md px-3 text-sm text-gray-700 transition-colors hover:bg-gray-100"
			>
				Убрать
			</button>
		</div>
	{:else}
		<div class="flex gap-2">
			<input
				id={inputId}
				type="text"
				bind:value={inputCode}
				autocomplete="off"
				autocapitalize="characters"
				aria-invalid={!!error}
				aria-describedby={error ? `${inputId}-error` : undefined}
				onkeydown={(e) => {
					if (e.key === 'Enter') {
						e.preventDefault();
						handleApply();
					}
				}}
				class="min-h-11 min-w-0 flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
			/>
			<button
				type="button"
				onclick={handleApply}
				class="min-h-11 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-control"
			>
				Применить
			</button>
		</div>
		{#if error}
			<p id="{inputId}-error" class="text-sm text-red-700">{error}</p>
		{/if}
	{/if}
</div>
