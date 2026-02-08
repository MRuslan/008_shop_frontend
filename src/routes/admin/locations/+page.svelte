<script lang="ts">
	import { locationsApi } from '$lib/api/locations';
	import type { Location } from '$lib/types/order';

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

	async function handleDelete(locationId: number) {
		if (!confirm('Удалить точку продаж?')) return;

		try {
			await locationsApi.deleteLocation(locationId);
			window.location.reload();
		} catch (error: any) {
			alert(error.message || 'Ошибка удаления точки');
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

			if (editingLocation) {
				await locationsApi.updateLocation(editingLocation.id, locationData);
			} else {
				await locationsApi.createLocation(locationData);
			}

			window.location.reload();
		} catch (err: any) {
			const message = err.message || 'Ошибка сохранения точки';
			if (Array.isArray(message)) {
				error = message.join(', ');
			} else {
				error = message;
			}
		} finally {
			isSubmitting = false;
		}
	}
</script>

<svelte:head>
	<title>Управление точками продаж - Админ-панель</title>
</svelte:head>

<div class="bg-white rounded-lg shadow-md p-6">
	<div class="flex items-center justify-between mb-6">
		<h1 class="text-2xl font-bold text-gray-800">Управление точками продаж</h1>
		<button
			onclick={handleCreate}
			class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
		>
			+ Добавить точку
		</button>
	</div>

	<!-- Форма точки -->
	{#if showLocationForm}
		<div class="mb-6 bg-gray-50 rounded-lg p-6 border-2 border-blue-500">
			<h2 class="text-xl font-semibold text-gray-800 mb-4">
				{editingLocation ? 'Редактирование точки' : 'Создание точки'}
			</h2>

			<form onsubmit={(e) => { e.preventDefault(); handleSubmit(); }} class="space-y-4">
				{#if error}
					<div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
						{error}
					</div>
				{/if}

				<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
					<div>
						<label class="block text-sm font-medium text-gray-700 mb-1">
							Название <span class="text-red-500">*</span>
						</label>
						<input
							type="text"
							bind:value={name}
							required
							class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
						/>
					</div>

					<div>
						<label class="block text-sm font-medium text-gray-700 mb-1">
							Тип <span class="text-red-500">*</span>
						</label>
						<select
							bind:value={type}
							class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
						>
							<option value="warehouse">Склад</option>
							<option value="pickup_point">Пункт выдачи</option>
							<option value="retail">Розничный магазин</option>
						</select>
					</div>
				</div>

				<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
					<div>
						<label class="block text-sm font-medium text-gray-700 mb-1">
							Город <span class="text-red-500">*</span>
						</label>
						<input
							type="text"
							bind:value={city}
							required
							class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
						/>
					</div>

					<div>
						<label class="block text-sm font-medium text-gray-700 mb-1">
							Улица <span class="text-red-500">*</span>
						</label>
						<input
							type="text"
							bind:value={street}
							required
							class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
						/>
					</div>
				</div>

				<div class="grid grid-cols-1 md:grid-cols-3 gap-4">
					<div>
						<label class="block text-sm font-medium text-gray-700 mb-1">
							Дом <span class="text-red-500">*</span>
						</label>
						<input
							type="text"
							bind:value={building}
							required
							class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
						/>
					</div>

					<div>
						<label class="block text-sm font-medium text-gray-700 mb-1">Квартира/Офис</label>
						<input
							type="text"
							bind:value={apartment}
							class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
						/>
					</div>

					<div>
						<label class="block text-sm font-medium text-gray-700 mb-1">Индекс</label>
						<input
							type="text"
							bind:value={postalCode}
							class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
						/>
					</div>
				</div>

				<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
					<div>
						<label class="block text-sm font-medium text-gray-700 mb-1">
							Телефон <span class="text-red-500">*</span>
						</label>
						<input
							type="tel"
							bind:value={phone}
							required
							class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
						/>
					</div>

					<div>
						<label class="block text-sm font-medium text-gray-700 mb-1">Порядок сортировки</label>
						<input
							type="number"
							bind:value={sortOrder}
							class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
						/>
					</div>
				</div>

				<div>
					<label class="flex items-center space-x-2">
						<input
							type="checkbox"
							bind:checked={isActive}
							class="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
						/>
						<span class="text-sm text-gray-700">Точка активна</span>
					</label>
				</div>

				<div class="flex space-x-2 pt-4">
					<button
						type="submit"
						disabled={isSubmitting}
						class="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
					>
						{isSubmitting ? 'Сохранение...' : 'Сохранить'}
					</button>
					<button
						type="button"
						onclick={() => {
							showLocationForm = false;
							editingLocation = null;
						}}
						class="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
					>
						Отмена
					</button>
				</div>
			</form>
		</div>
	{/if}

	<!-- Таблица точек -->
	<div class="overflow-x-auto">
		<table class="min-w-full divide-y divide-gray-200">
			<thead class="bg-gray-50">
				<tr>
					<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Название</th>
					<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Тип</th>
					<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Адрес</th>
					<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Телефон</th>
					<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Статус</th>
					<th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Действия</th>
				</tr>
			</thead>
			<tbody class="bg-white divide-y divide-gray-200">
				{#each data.locations as location}
					<tr class="hover:bg-gray-50">
						<td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
							{location.name}
						</td>
						<td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
							{location.type === 'warehouse' ? 'Склад' : location.type === 'pickup_point' ? 'Пункт выдачи' : 'Розничный магазин'}
						</td>
						<td class="px-6 py-4 text-sm text-gray-500">
							{location.city}, {location.street}, д. {location.building}
							{#if location.apartment}, {location.apartment}{/if}
						</td>
						<td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
							{location.phone}
						</td>
						<td class="px-6 py-4 whitespace-nowrap">
							<span
								class="px-2 py-1 text-xs font-medium rounded-full"
								class:bg-green-100={location.isActive}
								class:text-green-800={location.isActive}
								class:bg-red-100={!location.isActive}
								class:text-red-800={!location.isActive}
							>
								{location.isActive ? 'Активна' : 'Неактивна'}
							</span>
						</td>
						<td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
							<div class="flex justify-end space-x-2">
								<button
									onclick={() => handleEdit(location)}
									class="text-indigo-600 hover:text-indigo-900"
								>
									Редактировать
								</button>
								<button
									onclick={() => handleDelete(location.id)}
									class="text-red-600 hover:text-red-900"
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
