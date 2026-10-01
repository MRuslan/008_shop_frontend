<script lang="ts">
	import type { Location } from '$lib/types/order';
	import type { CartShortage } from '$lib/types/cart';
	import { formatOpeningHours } from '$lib/utils/opening-hours';
	import { shortageText } from '$lib/utils/availability';

	interface PointStock {
		available: boolean;
		shortages: CartShortage[];
	}

	interface Props {
		locations: Location[];
		selectedLocationId?: number | null;
		/** Наличие заказа по точкам из /cart/availability; без него точки не различаются */
		stock?: Map<number, PointStock> | null;
		onSelect: (locationId: number) => void;
	}

	let { locations, selectedLocationId = null, stock = null, onSelect }: Props = $props();

	// Выбор точки: группа radio, доступная с клавиатуры
	const groupName = $props.id();

	const anyAvailable = $derived(!stock || locations.some((location) => stock.get(location.id)?.available));
</script>

{#if locations.length === 0}
	<p class="text-gray-600 py-4">Самовывоз в этом магазине пока недоступен. Выберите доставку курьером.</p>
{:else}
	<fieldset class="m-0 flex min-w-0 flex-col gap-3 border-0 p-0">
		<legend class="sr-only">Точка самовывоза</legend>
		{#if !stock}
			<p class="text-sm text-gray-500">Наличие товаров проверим в выбранной точке при оформлении заказа.</p>
		{:else if !anyAvailable}
			<p class="text-sm text-caution">
				Ни в одной точке нет всего заказа сразу. Уменьшите количество в корзине или выберите доставку.
			</p>
		{/if}

		{#each locations as location (location.id)}
			{@const inputId = `${groupName}-${location.id}`}
			{@const selected = selectedLocationId === location.id}
			{@const hours = formatOpeningHours(location.openingHours)}
			{@const pointStock = stock?.get(location.id)}
			<!-- Точку без всего заказа выбрать нельзя: бэкенд не примет заказ, но покупатель видит, чего не хватает -->
			{@const blocked = !!stock && !pointStock?.available}
			<div
				class="rounded-lg border-2 transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-blue-500 has-[:focus-visible]:ring-offset-2 {selected
					? 'border-blue-600'
					: blocked
						? 'border-gray-200 bg-gray-50'
						: 'border-gray-300 hover:border-gray-400'}"
			>
				<input
					type="radio"
					id={inputId}
					name={groupName}
					value={location.id}
					checked={selected}
					disabled={blocked}
					aria-describedby={pointStock ? `${inputId}-stock` : undefined}
					onchange={() => onSelect(location.id)}
					class="sr-only"
				/>
				<label for={inputId} class="block p-4 {blocked ? 'cursor-not-allowed' : 'cursor-pointer'}">
					<span class="mb-2 block text-title-sm {blocked ? 'text-gray-600' : 'text-ink'}">{location.name}</span>
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
					{#if pointStock}
						<span id="{inputId}-stock" class="mt-2 block text-sm">
							{#if pointStock.available}
								<span class="text-positive">Весь заказ в наличии</span>
							{:else}
								<span class="block text-caution">Здесь нет всего заказа:</span>
								{#each pointStock.shortages as shortage (shortage.productId)}
									<span class="block text-gray-600">{shortageText(shortage)}</span>
								{/each}
							{/if}
						</span>
					{/if}
				</label>
			</div>
		{/each}
	</fieldset>
{/if}
