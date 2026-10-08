<script lang="ts">
	import Plus from '@lucide/svelte/icons/plus';
	import ActiveBadge from '$lib/components/ui/ActiveBadge.svelte';
	import { invalidateAll } from '$app/navigation';
	import { locationsApi } from '$lib/api/locations';
	import type { Location } from '$lib/types/order';
	import { getErrorMessage } from '$lib/utils/errors';
	import { toast } from '$lib/stores/toast';
	import { confirmDialog } from '$lib/stores/confirm';

	interface Props {
		data: {
			locations: Location[];
		};
	}

	let { data }: Props = $props();

	let showLocationForm = $state(false);
	let editingLocation = $state<Location | null>(null);
	let name = $state('');
	let type = $state<'warehouse' | 'pickup_point' | 'retail'>('pickup_point');
	let city = $state('');
	let street = $state('');
	let building = $state('');
	let apartment = $state('');
	let postalCode = $state('');
	let phone = $state('');
	let sortOrder = $state(0);
	let isActive = $state(true);
	let isSubmitting = $state(false);
	let error = $state<string | null>(null);

	function handleCreate() {
		editingLocation = null;
		name = '';
		type = 'pickup_point';
		city = '';
		street = '';
		building = '';
		apartment = '';
		postalCode = '';
		phone = '';
		sortOrder = 0;
		isActive = true;
		showLocationForm = true;
	}

	function handleEdit(location: Location) {
		editingLocation = location;
		name = location.name;
		type = location.type;
		city = location.city;
		street = location.street;
		building = location.building;
		apartment = location.apartment || '';
		postalCode = location.postalCode || '';
		phone = location.phone;
		sortOrder = location.sortOrder;
		isActive = location.isActive;
		showLocationForm = true;
	}

	async function handleDelete(location: Location) {
		const confirmed = await confirmDialog({
			title: `Удалить точку «${location.name}»?`,
			message: 'Покупатели больше не смогут выбрать её для самовывоза.',
			confirmLabel: 'Удалить',
			danger: true
		});
		if (!confirmed) return;

		try {
			await locationsApi.deleteLocation(location.id);
			await invalidateAll();
			toast.success(`Точка «${location.name}» удалена`);
		} catch (err) {
			toast.error(getErrorMessage(err, 'Не удалось удалить точку'));
		}
	}

	async function handleSubmit() {
		error = null;

		if (!name.trim() || !city.trim() || !street.trim() || !building.trim() || !phone.trim()) {
			error = 'Заполните все обязательные поля';
			return;
		}

		isSubmitting = true;

		try {
			const locationData: any = {
				name: name.trim(),
				type,
				city: city.trim(),
				street: street.trim(),
				building: building.trim(),
				apartment: apartment.trim() || undefined,
				postalCode: postalCode.trim() || undefined,
				phone: phone.trim(),
				sortOrder,
				isActive
			};

			const wasEditing = Boolean(editingLocation);
			if (editingLocation) {
				await locationsApi.updateLocation(editingLocation.id, locationData);
			} else {
				await locationsApi.createLocation(locationData);
			}

			await invalidateAll();
			showLocationForm = false;
			editingLocation = null;
			toast.success(wasEditing ? `Точка «${locationData.name}» обновлена` : `Точка «${locationData.name}» создана`);
		} catch (err) {
			error = getErrorMessage(err, 'Не удалось сохранить точку');
		} finally {
			isSubmitting = false;
		}
	}
</script>

<svelte:head>
	<title>Управление точками продаж - Админ-панель</title>
</svelte:head>

<div class="rounded-2xl bg-surface p-5 md:p-6">
	<div class="flex items-center justify-between mb-6">
		<h1 class="text-headline text-ink">Управление точками продаж</h1>
		<button
			onclick={handleCreate}
			class="btn-primary"
		>
			<Plus class="size-4" aria-hidden="true" />
			Добавить точку
		</button>
	</div>

	<!-- Форма точки -->
	{#if showLocationForm}
		<!-- Форма — раздел той же панели, отделённый линией, а не вложенная карточка -->
		<div class="mb-6 border-b border-line pb-6">
			<h2 class="text-title text-ink mb-4">
				{editingLocation ? 'Редактирование точки' : 'Создание точки'}
			</h2>

			<form onsubmit={(e) => { e.preventDefault(); handleSubmit(); }} class="space-y-4">
				{#if error}
					<div role="alert" class="notice-error">
						{error}
					</div>
				{/if}

				<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
					<div>
						<label for="location-field-1" class="field-label">
							Название <span class="text-negative" aria-hidden="true">*</span>
						</label>
						<input
						id="location-field-1"
							type="text"
							bind:value={name}
							required
							class="w-full field"
						/>
					</div>

					<div>
						<label for="location-field-2" class="field-label">
							Тип <span class="text-negative" aria-hidden="true">*</span>
						</label>
						<select
						id="location-field-2"
							bind:value={type}
							class="w-full field"
						>
							<option value="warehouse">Склад</option>
							<option value="pickup_point">Пункт выдачи</option>
							<option value="retail">Розничный магазин</option>
						</select>
					</div>
				</div>

				<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
					<div>
						<label for="location-field-3" class="field-label">
							Город <span class="text-negative" aria-hidden="true">*</span>
						</label>
						<input
						id="location-field-3"
							type="text"
							bind:value={city}
							required
							class="w-full field"
						/>
					</div>

					<div>
						<label for="location-field-4" class="field-label">
							Улица <span class="text-negative" aria-hidden="true">*</span>
						</label>
						<input
						id="location-field-4"
							type="text"
							bind:value={street}
							required
							class="w-full field"
						/>
					</div>
				</div>

				<div class="grid grid-cols-1 md:grid-cols-3 gap-4">
					<div>
						<label for="location-field-5" class="field-label">
							Дом <span class="text-negative" aria-hidden="true">*</span>
						</label>
						<input
						id="location-field-5"
							type="text"
							bind:value={building}
							required
							class="w-full field"
						/>
					</div>

					<div>
						<label for="location-field-6" class="field-label">Квартира/Офис</label>
						<input
						id="location-field-6"
							type="text"
							bind:value={apartment}
							class="w-full field"
						/>
					</div>

					<div>
						<label for="location-field-7" class="field-label">Индекс</label>
						<input
						id="location-field-7"
							type="text"
							bind:value={postalCode}
							class="w-full field"
						/>
					</div>
				</div>

				<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
					<div>
						<label for="location-field-8" class="field-label">
							Телефон <span class="text-negative" aria-hidden="true">*</span>
						</label>
						<input
						id="location-field-8"
							type="tel"
							bind:value={phone}
							required
							class="w-full field"
						/>
					</div>

					<div>
						<label for="location-field-9" class="field-label">Порядок сортировки</label>
						<input
						id="location-field-9"
							type="number"
							bind:value={sortOrder}
							class="w-full field"
						/>
					</div>
				</div>

				<div>
					<label class="flex min-h-11 cursor-pointer items-center gap-2.5">
						<input
							type="checkbox"
							bind:checked={isActive}
							class="size-4"
						/>
						<span class="text-body-sm text-gray-800">Точка активна</span>
					</label>
				</div>

				<div class="flex flex-wrap gap-2 pt-2">
					<button
						type="submit"
						disabled={isSubmitting}
						class="flex-1 btn-primary"
					>
						{isSubmitting ? 'Сохранение...' : 'Сохранить'}
					</button>
					<button
						type="button"
						onclick={() => {
							showLocationForm = false;
							editingLocation = null;
						}}
						class="btn-secondary"
					>
						Отмена
					</button>
				</div>
			</form>
		</div>
	{/if}

	<!-- Таблица точек -->
	<div class="overflow-x-auto">
		<table class="min-w-full divide-y divide-line text-left">
			<thead class="bg-gray-50">
				<tr>
					<th class="text-left font-medium text-gray-500 px-4 py-3 text-label">Название</th>
					<th class="text-left font-medium text-gray-500 px-4 py-3 text-label">Тип</th>
					<th class="text-left font-medium text-gray-500 px-4 py-3 text-label">Адрес</th>
					<th class="text-left font-medium text-gray-500 px-4 py-3 text-label">Телефон</th>
					<th class="text-left font-medium text-gray-500 px-4 py-3 text-label">Статус</th>
					<th class="text-right font-medium text-gray-500 px-4 py-3 text-label">Действия</th>
				</tr>
			</thead>
			<tbody class="divide-y divide-line">
				{#each data.locations as location}
					<tr class="hover:bg-gray-50">
						<td class="whitespace-nowrap text-body-sm font-medium text-gray-900 px-4 py-3">
							{location.name}
						</td>
						<td class="whitespace-nowrap text-body-sm text-gray-500 px-4 py-3">
							{location.type === 'warehouse' ? 'Склад' : location.type === 'pickup_point' ? 'Пункт выдачи' : 'Розничный магазин'}
						</td>
						<td class="text-body-sm text-gray-500 px-4 py-3">
							{location.city}, {location.street}, д. {location.building}
							{#if location.apartment}, {location.apartment}{/if}
						</td>
						<td class="whitespace-nowrap text-body-sm text-gray-500 px-4 py-3">
							{location.phone}
						</td>
						<td class="whitespace-nowrap px-4 py-3">
							<ActiveBadge active={location.isActive} on="Активна" off="Неактивна" />
						</td>
						<td class="whitespace-nowrap text-right text-body-sm font-medium px-4 py-3">
							<div class="flex justify-end gap-1">
								<button
									onclick={() => handleEdit(location)}
									class="btn-text"
								>
									Редактировать
								</button>
								<button
									onclick={() => handleDelete(location)}
									class="btn-text text-negative hover:text-negative"
								>
									Удалить
								</button>
							</div>
						</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>

	{#if data.locations.length === 0}
		<div class="text-center py-8 text-gray-500">
			Точки продаж не найдены
		</div>
	{/if}
</div>
