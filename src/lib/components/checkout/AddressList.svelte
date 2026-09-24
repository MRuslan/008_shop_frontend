<script lang="ts">
	import type { Address } from '$lib/types/common';
	import { confirmDialog } from '$lib/stores/confirm';

	interface Props {
		addresses: Address[];
		selectedAddressId?: number | null;
		/** Подпись группы для скринридера */
		legend?: string;
		onSelect: (addressId: number) => void;
		onEdit: (address: Address) => void;
		onDelete: (addressId: number) => void;
		onAddNew: () => void;
	}

	let {
		addresses,
		selectedAddressId = null,
		legend = 'Адрес доставки',
		onSelect,
		onEdit,
		onDelete,
		onAddNew
	}: Props = $props();

	// Выбор адреса: группа radio, доступная с клавиатуры (Tab на группу, стрелки между адресами)
	const groupName = $props.id();

	function formatAddress(address: Address): string {
		const apartment = address.apartment ? `, кв. ${address.apartment}` : '';
		return `${address.city}, ${address.street}, д. ${address.building}${apartment}`;
	}

	async function handleDelete(address: Address) {
		const confirmed = await confirmDialog({
			title: 'Удалить адрес?',
			message: `${address.label}: ${formatAddress(address)}`,
			confirmLabel: 'Удалить',
			danger: true
		});
		if (confirmed) onDelete(address.id);
	}
</script>

<fieldset class="m-0 flex min-w-0 flex-col gap-3 border-0 p-0">
	<legend class="sr-only">{legend}</legend>

	{#each addresses as address (address.id)}
		{@const inputId = `${groupName}-${address.id}`}
		{@const selected = selectedAddressId === address.id}
		<div
			class="flex items-start rounded-lg border-2 transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-blue-500 has-[:focus-visible]:ring-offset-2 {selected
				? 'border-blue-600'
				: 'border-gray-300 hover:border-gray-400'}"
		>
			<input
				type="radio"
				id={inputId}
				name={groupName}
				value={address.id}
				checked={selected}
				onchange={() => onSelect(address.id)}
				class="sr-only"
			/>
			<label for={inputId} class="min-w-0 flex-1 cursor-pointer p-4">
				<span class="mb-2 flex flex-wrap items-center gap-2">
					<span class="font-semibold text-gray-800">{address.label}</span>
					{#if address.isDefault}
						<span class="rounded bg-blue-100 px-2 py-1 text-xs text-blue-800">По умолчанию</span>
					{/if}
				</span>
				<span class="block text-sm text-gray-600">{formatAddress(address)}</span>
				{#if address.postalCode}
					<span class="block text-sm text-gray-600">Индекс: {address.postalCode}</span>
				{/if}
				<span class="block text-sm text-gray-600">Телефон: {address.phone}</span>
			</label>

			<div class="flex shrink-0 gap-1 p-2">
				<button
					type="button"
					onclick={() => onEdit(address)}
					class="rounded p-2 text-blue-600 transition-colors hover:bg-blue-50 hover:text-blue-800 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none"
					aria-label="Редактировать адрес «{address.label}»"
				>
					<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
						/>
					</svg>
				</button>
				<button
					type="button"
					onclick={() => handleDelete(address)}
					class="rounded p-2 text-red-600 transition-colors hover:bg-red-50 hover:text-red-800 focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:outline-none"
					aria-label="Удалить адрес «{address.label}»"
				>
					<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
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
	{/each}

	<button
		type="button"
		onclick={onAddNew}
		class="w-full rounded-lg border-2 border-dashed border-gray-300 p-4 text-gray-600 transition-colors hover:border-blue-600 hover:text-blue-600 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none"
	>
		+ Добавить новый адрес
	</button>
</fieldset>
