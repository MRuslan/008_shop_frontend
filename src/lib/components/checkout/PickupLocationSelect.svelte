<script lang="ts">
	import type { Location } from '$lib/types/order';
	import { formatOpeningHours } from '$lib/utils/opening-hours';

	interface Props {
		locations: Location[];
		selectedLocationId?: number | null;
		onSelect: (locationId: number) => void;
	}

	let { locations, selectedLocationId = null, onSelect }: Props = $props();

	// Выбор точки: группа radio, доступная с клавиатуры
	const groupName = $props.id();
</script>

{#if locations.length === 0}
	<p class="text-gray-500 text-center py-4">Точки самовывоза пока не добавлены</p>
{:else}
	<fieldset class="m-0 flex min-w-0 flex-col gap-3 border-0 p-0">
		<legend class="sr-only">Точка самовывоза</legend>

		{#each locations as location (location.id)}
			{@const inputId = `${groupName}-${location.id}`}
			{@const selected = selectedLocationId === location.id}
			{@const hours = formatOpeningHours(location.openingHours)}
			<div
				class="rounded-lg border-2 transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-blue-500 has-[:focus-visible]:ring-offset-2 {selected
					? 'border-blue-600'
					: 'border-gray-300 hover:border-gray-400'}"
			>
				<input
					type="radio"
					id={inputId}
					name={groupName}
					value={location.id}
					checked={selected}
					onchange={() => onSelect(location.id)}
					class="sr-only"
				/>
				<label for={inputId} class="block cursor-pointer p-4">
					<span class="mb-2 block font-semibold text-gray-800">{location.name}</span>
					<span class="mb-1 block text-sm text-gray-600">
						{location.city}, {location.street}, д. {location.building}
						{#if location.apartment}, {location.apartment}{/if}
					</span>
					{#if location.postalCode}
						<span class="block text-sm text-gray-600">Индекс: {location.postalCode}</span>
					{/if}
					<span class="block text-sm text-gray-600">Телефон: {location.phone}</span>
					{#if hours.length > 0}
						<span class="mt-2 block text-sm text-gray-600">
							<span class="block font-medium">График работы:</span>
							{#each hours as line (line)}
								<span class="block">{line}</span>
							{/each}
						</span>
					{/if}
				</label>
			</div>
		{/each}
	</fieldset>
{/if}
