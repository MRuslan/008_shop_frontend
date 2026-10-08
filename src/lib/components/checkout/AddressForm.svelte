<script lang="ts">
	import type { CreateAddressDto, UpdateAddressDto, Address } from '$lib/types/common';
	import { getErrorMessage } from '$lib/utils/errors';

	interface Props {
		address?: Address | null;
		onSave: (data: CreateAddressDto | UpdateAddressDto) => Promise<void>;
		onCancel: () => void;
	}

	let { address, onSave, onCancel }: Props = $props();

	const uid = $props.id();

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

		// Называем именно те поля, которые остались пустыми
		const missing = [
			[label, 'название'],
			[city, 'город'],
			[street, 'улица'],
			[building, 'дом'],
			[phone, 'телефон']
		]
			.filter(([value]) => !value.trim())
			.map(([, name]) => name);
		if (missing.length) {
			error = `Заполните: ${missing.join(', ')}.`;
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
		} catch (err) {
			error = getErrorMessage(err, 'Не удалось сохранить адрес. Попробуйте ещё раз.');
		} finally {
			isSaving = false;
		}
	}
</script>

<form onsubmit={(e) => { e.preventDefault(); handleSubmit(); }} class="space-y-4" novalidate>
	{#if error}
		<div role="alert" class="notice-error">
			{error}
		</div>
	{/if}

	<div>
		<label for="{uid}-label" class="field-label">
			Название
		</label>
		<input
			id="{uid}-label"
			type="text"
			bind:value={label}
			required
			placeholder="Например, «Дом» или «Работа»"
			aria-describedby="{uid}-label-hint"
			class="w-full field"
		/>
		<p id="{uid}-label-hint" class="mt-1 text-body-sm text-gray-500">Чтобы быстро выбрать адрес в следующий раз</p>
	</div>

	<div>
		<label for="{uid}-city" class="field-label">
			Город
		</label>
		<input
			id="{uid}-city"
			type="text"
			bind:value={city}
			required
			autocomplete="address-level2"
			class="w-full field"
		/>
	</div>

	<div>
		<label for="{uid}-street" class="field-label">
			Улица
		</label>
		<input
			id="{uid}-street"
			type="text"
			bind:value={street}
			required
			autocomplete="address-line1"
			class="w-full field"
		/>
	</div>

	<div class="grid grid-cols-2 gap-4">
		<div>
			<label for="{uid}-building" class="field-label">
				Дом
			</label>
			<input
				id="{uid}-building"
				type="text"
				bind:value={building}
				required
				class="w-full field"
			/>
		</div>
		<div>
			<label for="{uid}-apartment" class="field-label">
				Квартира или офис <span class="font-normal text-gray-500">(необязательно)</span>
			</label>
			<input
				id="{uid}-apartment"
				type="text"
				bind:value={apartment}
				class="w-full field"
			/>
		</div>
	</div>

	<div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
		<div>
			<label for="{uid}-phone" class="field-label">
				Телефон
			</label>
			<input
				id="{uid}-phone"
				type="tel"
				bind:value={phone}
				required
				autocomplete="tel"
				inputmode="tel"
				aria-describedby="{uid}-phone-hint"
				class="w-full field"
			/>
			<p id="{uid}-phone-hint" class="mt-1 text-body-sm text-gray-500">Для связи по заказу</p>
		</div>
		<div>
			<label for="{uid}-postal" class="field-label">
				Индекс <span class="font-normal text-gray-500">(необязательно)</span>
			</label>
			<input
				id="{uid}-postal"
				type="text"
				bind:value={postalCode}
				autocomplete="postal-code"
				inputmode="numeric"
				class="w-full field"
			/>
		</div>
	</div>

	<label class="flex min-h-11 items-center gap-2">
		<input
			type="checkbox"
			bind:checked={isDefault}
			class="size-4"
		/>
		<span class="text-body-sm text-gray-800">Подставлять этот адрес в новые заказы</span>
	</label>

	<div class="flex gap-2">
		<button
			type="submit"
			disabled={isSaving}
			class="flex-1 btn-primary"
		>
			{isSaving ? 'Сохраняем…' : 'Сохранить адрес'}
		</button>
		<button
			type="button"
			onclick={onCancel}
			class="btn-secondary"
		>
			Отмена
		</button>
	</div>
</form>
