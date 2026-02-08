<script lang="ts">
	import type { Location } from '$lib/types/order';

	interface Props {
		locations: Location[];
		selectedLocationId?: number | null;
		onSelect: (locationId: number) => void;
	}

	let { locations, selectedLocationId, onSelect }: Props = $props();
</script>

<div class="space-y-3">
	{#each locations as location (location.id)}
		<div
			class="border-2 rounded-lg p-4 cursor-pointer transition-colors"
			class:border-blue-600={selectedLocationId === location.id}
			class:border-gray-300={selectedLocationId !== location.id}
			onclick={() => onSelect(location.id)}
		>
			<h3 class="font-semibold text-gray-800 mb-2">{location.name}</h3>
			<p class="text-sm text-gray-600 mb-1">
				{location.city}, {location.street}, д. {location.building}
				{#if location.apartment}, {location.apartment}{/if}
			</p>
			{#if location.postalCode}
				<p class="text-sm text-gray-600">Индекс: {location.postalCode}</p>
			{/if}
			<p class="text-sm text-gray-600">Телефон: {location.phone}</p>
			{#if location.openingHours && location.openingHours.length > 0}
				<div class="mt-2 text-sm text-gray-600">
					<p class="font-medium">График работы:</p>
					{#each location.openingHours as hours}
						<p>
							{['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'][hours.day - 1]}: {hours.from} - {hours.to}
						</p>
					{/each}
				</div>
			{/if}
		</div>
	{/each}

	{#if locations.length === 0}
		<p class="text-gray-500 text-center py-4">Точки самовывоза не найдены</p>
	{/if}
</div>
