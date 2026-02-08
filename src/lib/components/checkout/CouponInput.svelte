<script lang="ts">
	interface Props {
		couponCode: string | null;
		discountAmount: string | null;
		onApply: (code: string) => Promise<void>;
		onRemove: () => void;
	}

	let { couponCode, discountAmount, onApply, onRemove }: Props = $props();

	let inputCode = $state('');
	let isApplying = $state(false);
	let error = $state<string | null>(null);

	async function handleApply() {
		if (!inputCode.trim()) {
			error = 'Введите код купона';
			return;
		}

		isApplying = true;
		error = null;

		try {
			await onApply(inputCode.trim().toUpperCase());
			inputCode = '';
		} catch (err: any) {
			error = err.message || 'Неверный код купона';
		} finally {
			isApplying = false;
		}
	}
</script>

<div class="space-y-2">
	<label class="block text-sm font-medium text-gray-700">Промокод</label>
	
	{#if couponCode}
		<div class="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-md">
			<div>
				<p class="text-sm font-medium text-green-800">Купон применён: {couponCode}</p>
				{#if discountAmount}
					<p class="text-xs text-green-600">Скидка: {discountAmount}</p>
				{/if}
			</div>
			<button
				onclick={onRemove}
				class="text-red-600 hover:text-red-800 transition-colors"
				aria-label="Удалить купон"
			>
				<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M6 18L18 6M6 6l12 12"
					/>
				</svg>
			</button>
		</div>
	{:else}
		<div class="flex space-x-2">
			<input
				type="text"
				bind:value={inputCode}
				placeholder="Введите код купона"
				onkeydown={(e) => {
					if (e.key === 'Enter') {
						e.preventDefault();
						handleApply();
					}
				}}
				class="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
			/>
			<button
				onclick={handleApply}
				disabled={isApplying}
				class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
			>
				{isApplying ? 'Применение...' : 'Применить'}
			</button>
		</div>
		{#if error}
			<p class="text-sm text-red-600">{error}</p>
		{/if}
	{/if}
</div>
