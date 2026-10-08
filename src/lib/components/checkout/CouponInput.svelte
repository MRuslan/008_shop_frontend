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
	<label for={inputId} class="field-label">Промокод</label>

	{#if couponCode}
		<div
			class="flex items-center justify-between gap-3 rounded-xl p-3 pl-4 {status === 'rejected'
				? 'bg-negative/8'
				: 'bg-gray-100'}"
		>
			<div aria-live="polite">
				<p class="text-body-sm font-medium text-gray-900">{couponCode}</p>
				{#if status === 'checking'}
					<p class="text-body-sm text-gray-600">Проверяем промокод…</p>
				{:else if status === 'applied'}
					<p class="text-body-sm text-positive">
						{discountLabel ? `Скидка ${discountLabel}` : 'Промокод применён'}
					</p>
				{:else if status === 'rejected'}
					<p class="text-body-sm text-negative">{rejection ?? 'Промокод не подходит к этому заказу.'}</p>
				{:else}
					<p class="text-body-sm text-gray-600">Проверим и применим при оформлении заказа</p>
				{/if}
			</div>
			<button
				type="button"
				onclick={onRemove}
				class="btn-text"
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
				class="min-w-0 flex-1 field"
			/>
			<button
				type="button"
				onclick={handleApply}
				class="btn-primary"
			>
				Применить
			</button>
		</div>
		{#if error}
			<p id="{inputId}-error" class="text-body-sm text-negative">{error}</p>
		{/if}
	{/if}
</div>
