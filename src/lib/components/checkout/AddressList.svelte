<script lang="ts">
	import type { Address } from '$lib/types/common';
	import Pencil from '@lucide/svelte/icons/pencil';
	import Trash2 from '@lucide/svelte/icons/trash-2';
	import Plus from '@lucide/svelte/icons/plus';
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
			title: `Удалить адрес «${address.label}»?`,
			message: `${formatAddress(address)}. Уже оформленные заказы это не затронет.`,
			confirmLabel: 'Удалить адрес',
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
			class="flex items-start rounded-xl border-2 transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ink has-[:focus-visible]:ring-offset-2 {selected
				? 'border-ink'
				: 'border-line hover:border-gray-300'}"
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
					<span class="text-title-sm text-ink">{address.label}</span>
					{#if address.isDefault}
						<span class="rounded-md bg-gray-100 px-2 py-0.5 text-label font-medium text-gray-700">По умолчанию</span>
					{/if}
				</span>
				<span class="block text-body-sm text-gray-600">{formatAddress(address)}</span>
				{#if address.postalCode}
					<span class="block text-body-sm text-gray-600">Индекс: {address.postalCode}</span>
				{/if}
				<span class="block text-body-sm text-gray-600">Телефон: {address.phone}</span>
			</label>

			<div class="flex shrink-0 gap-1 p-2">
				<button
					type="button"
					onclick={() => onEdit(address)}
					class="inline-flex size-11 items-center justify-center rounded-xl text-gray-600 transition-colors hover:bg-gray-100 hover:text-ink"
					aria-label="Редактировать адрес «{address.label}»"
				>
					<Pencil class="size-4.5" aria-hidden="true" />
				</button>
				<button
					type="button"
					onclick={() => handleDelete(address)}
					class="inline-flex size-11 items-center justify-center rounded-xl text-gray-600 transition-colors hover:bg-negative/8 hover:text-negative"
					aria-label="Удалить адрес «{address.label}»"
				>
					<Trash2 class="size-4.5" aria-hidden="true" />
				</button>
			</div>
		</div>
	{/each}

	<button
		type="button"
		onclick={onAddNew}
		class="btn-secondary w-full"
	>
		<Plus class="size-4" aria-hidden="true" />
		Добавить адрес
	</button>
</fieldset>
