<script lang="ts">
	import type { CreateAddressDto, UpdateAddressDto, Address } from '$lib/types/common';

	interface Props {
		address?: Address | null;
		onSave: (data: CreateAddressDto | UpdateAddressDto) => Promise<void>;
		onCancel: () => void;
	}

	let { address, onSave, onCancel }: Props = $props();

	let label = $state(address?.label || '');
	let city = $state(address?.city || '');
	let street = $state(address?.street || '');
	let building = $state(address?.building || '');
	let apartment = $state(address?.apartment || '');
	let postalCode = $state(address?.postalCode || '');
	let phone = $state(address?.phone || '');
	let isDefault = $state(address?.isDefault || false);
	let isSaving = $state(false);
	let error = $state<string | null>(null);

	async function handleSubmit() {
		error = null;

		// Валидация
		if (!label.trim() || !city.trim() || !street.trim() || !building.trim() || !phone.trim()) {
			error = 'Заполните все обязательные поля';
			return;
		}

		isSaving = true;

		try {
			const data: CreateAddressDto | UpdateAddressDto = {
				label: label.trim(),
				city: city.trim(),
				street: street.trim(),
				building: building.trim(),
				apartment: apartment.trim() || undefined,
				postalCode: postalCode.trim() || undefined,
				phone: phone.trim(),
				isDefault: isDefault || undefined
			};

			await onSave(data);
		} catch (err: any) {
			error = err.message || 'Ошибка сохранения адреса';
		} finally {
			isSaving = false;
		}
	}
</script>

<form onsubmit={(e) => { e.preventDefault(); handleSubmit(); }} class="space-y-4">
	{#if error}
		<div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
			{error}
		</div>
	{/if}

	<div>
		<label for="label" class="block text-sm font-medium text-gray-700 mb-1">
			Название адреса <span class="text-red-500">*</span>
		</label>
		<input
			id="label"
			type="text"
			bind:value={label}
			required
			placeholder="Дом, Офис и т.д."
			class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
		/>
	</div>

	<div>
		<label for="city" class="block text-sm font-medium text-gray-700 mb-1">
			Город <span class="text-red-500">*</span>
		</label>
		<input
			id="city"
			type="text"
			bind:value={city}
			required
			class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
		/>
	</div>

	<div>
		<label for="street" class="block text-sm font-medium text-gray-700 mb-1">
			Улица <span class="text-red-500">*</span>
		</label>
		<input
			id="street"
			type="text"
			bind:value={street}
			required
			class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
		/>
	</div>

	<div class="grid grid-cols-2 gap-4">
		<div>
			<label for="building" class="block text-sm font-medium text-gray-700 mb-1">
				Дом <span class="text-red-500">*</span>
			</label>
			<input
				id="building"
				type="text"
				bind:value={building}
				required
				class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
			/>
		</div>
		<div>
			<label for="apartment" class="block text-sm font-medium text-gray-700 mb-1">
				Квартира/Офис
			</label>
			<input
				id="apartment"
				type="text"
				bind:value={apartment}
				class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
			/>
		</div>
	</div>

	<div class="grid grid-cols-2 gap-4">
		<div>
			<label for="postalCode" class="block text-sm font-medium text-gray-700 mb-1">
				Индекс
			</label>
			<input
				id="postalCode"
				type="text"
				bind:value={postalCode}
				class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
			/>
		</div>
		<div>
			<label for="phone" class="block text-sm font-medium text-gray-700 mb-1">
				Телефон <span class="text-red-500">*</span>
			</label>
			<input
				id="phone"
				type="tel"
				bind:value={phone}
				required
				class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
			/>
		</div>
	</div>

	<div>
		<label class="flex items-center space-x-2">
			<input
				type="checkbox"
				bind:checked={isDefault}
				class="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
			/>
			<span class="text-sm text-gray-700">Сделать адресом по умолчанию</span>
		</label>
	</div>

	<div class="flex space-x-2">
		<button
			type="submit"
			disabled={isSaving}
			class="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
		>
			{isSaving ? 'Сохранение...' : 'Сохранить'}
		</button>
		<button
			type="button"
			onclick={onCancel}
			class="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
		>
			Отмена
		</button>
	</div>
</form>
