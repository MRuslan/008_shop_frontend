<script lang="ts">
	import type { Address } from '$lib/types/common';

	interface Props {
		addresses: Address[];
		selectedAddressId?: number | null;
		onSelect: (addressId: number) => void;
		onEdit: (address: Address) => void;
		onDelete: (addressId: number) => void;
		onAddNew: () => void;
	}

	let { addresses, selectedAddressId, onSelect, onEdit, onDelete, onAddNew }: Props = $props();
</script>

<div class="space-y-3">
	{#each addresses as address (address.id)}
		<div
			class="border-2 rounded-lg p-4 cursor-pointer transition-colors"
			class:border-blue-600={selectedAddressId === address.id}
			class:border-gray-300={selectedAddressId !== address.id}
			onclick={() => onSelect(address.id)}
		>
			<div class="flex items-start justify-between">
				<div class="flex-1">
					<div class="flex items-center space-x-2 mb-2">
						<h3 class="font-semibold text-gray-800">{address.label}</h3>
						{#if address.isDefault}
							<span class="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">По умолчанию</span>
						{/if}
					</div>
					<p class="text-sm text-gray-600">
						{address.city}, {address.street}, д. {address.building}
						{#if address.apartment}, кв. {address.apartment}{/if}
					</p>
					{#if address.postalCode}
						<p class="text-sm text-gray-600">Индекс: {address.postalCode}</p>
					{/if}
					<p class="text-sm text-gray-600">Телефон: {address.phone}</p>
				</div>
				<div class="flex space-x-2 ml-4">
					<button
						onclick={(e) => {
							e.stopPropagation();
							onEdit(address);
						}}
						class="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded transition-colors"
						aria-label="Редактировать"
					>
						<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
							/>
						</svg>
					</button>
					<button
						onclick={(e) => {
							e.stopPropagation();
							if (confirm('Удалить адрес?')) {
								onDelete(address.id);
							}
						}}
						class="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded transition-colors"
						aria-label="Удалить"
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
		</div>
	{/each}

	<button
		onclick={onAddNew}
		class="w-full border-2 border-dashed border-gray-300 rounded-lg p-4 text-gray-600 hover:border-blue-600 hover:text-blue-600 transition-colors"
	>
		+ Добавить новый адрес
	</button>
</div>
