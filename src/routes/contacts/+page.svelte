<script lang="ts">
	import { page } from '$app/state';
	import { storeSettings } from '$lib/stores/store';
	import { formatOpeningHours } from '$lib/utils/opening-hours';
	import type { Location } from '$lib/types/order';

	interface Props {
		data: {
			locations: Location[];
			locationsError: string | null;
		};
	}

	let { data }: Props = $props();

	const siteUrl = $derived(page.url.origin);
	const siteName = $derived($storeSettings?.name || 'Интернет-магазин');

	const typeLabels: Record<Location['type'], string> = {
		warehouse: 'Склад',
		pickup_point: 'Пункт выдачи',
		retail: 'Магазин'
	};

	// Склады покупателю не нужны: показываем только те точки, куда можно прийти
	const visibleLocations = $derived(data.locations.filter((l) => l.type !== 'warehouse'));

	const hasContacts = $derived(
		Boolean($storeSettings?.contactEmail || $storeSettings?.contactPhone)
	);
	const hasLegal = $derived(
		Boolean($storeSettings?.legalName || $storeSettings?.inn || $storeSettings?.legalAddress)
	);

	function telHref(phone: string): string {
		return `tel:${phone.replace(/[^\d+]/g, '')}`;
	}
</script>

<svelte:head>
	<title>Контакты | {siteName}</title>
	<meta name="description" content="Как связаться с {siteName}: телефон, email, адреса точек выдачи и график работы." />
	<link rel="canonical" href="{siteUrl}/contacts" />
</svelte:head>

<div class="container mx-auto px-4 py-8">
	<h1 class="text-3xl font-bold text-gray-800 mb-6">Контакты</h1>

	{#if !$storeSettings}
		<p class="text-gray-600">Информация о магазине ещё не заполнена.</p>
	{:else}
		<div class="grid grid-cols-1 gap-6 lg:grid-cols-3">
			<div class="space-y-6 lg:col-span-1">
				<!-- Связь -->
				<section class="bg-white rounded-lg shadow-md p-6">
					<h2 class="text-lg font-semibold text-gray-800 mb-4">Связаться с нами</h2>
					{#if hasContacts}
						<dl class="space-y-3 text-sm">
							{#if $storeSettings.contactPhone}
								<div>
									<dt class="text-gray-500">Телефон</dt>
									<dd class="mt-0.5">
										<a
											href={telHref($storeSettings.contactPhone)}
											class="font-medium text-gray-900 hover:text-blue-600"
										>
											{$storeSettings.contactPhone}
										</a>
									</dd>
								</div>
							{/if}
							{#if $storeSettings.contactEmail}
								<div>
									<dt class="text-gray-500">Email</dt>
									<dd class="mt-0.5">
										<a
											href="mailto:{$storeSettings.contactEmail}"
											class="font-medium text-gray-900 break-all hover:text-blue-600"
										>
											{$storeSettings.contactEmail}
										</a>
									</dd>
								</div>
							{/if}
						</dl>
					{:else}
						<p class="text-sm text-gray-600">Контактные данные пока не указаны.</p>
					{/if}
				</section>

				<!-- Реквизиты -->
				{#if hasLegal}
					<section class="bg-white rounded-lg shadow-md p-6">
						<h2 class="text-lg font-semibold text-gray-800 mb-4">Реквизиты</h2>
						<dl class="space-y-3 text-sm">
							{#if $storeSettings.legalName}
								<div>
									<dt class="text-gray-500">Наименование</dt>
									<dd class="mt-0.5 text-gray-900">{$storeSettings.legalName}</dd>
								</div>
							{/if}
							{#if $storeSettings.inn}
								<div>
									<dt class="text-gray-500">ИНН</dt>
									<dd class="mt-0.5 text-gray-900 tabular-nums">{$storeSettings.inn}</dd>
								</div>
							{/if}
							{#if $storeSettings.legalAddress}
								<div>
									<dt class="text-gray-500">Юридический адрес</dt>
									<dd class="mt-0.5 text-gray-900">{$storeSettings.legalAddress}</dd>
								</div>
							{/if}
						</dl>
					</section>
				{/if}
			</div>

			<!-- Точки продаж -->
			<section class="lg:col-span-2">
				<h2 class="text-lg font-semibold text-gray-800 mb-4">Где нас найти</h2>

				{#if data.locationsError}
					<div role="alert" class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
						{data.locationsError}
					</div>
				{:else if visibleLocations.length === 0}
					<p class="text-sm text-gray-600">Точки выдачи пока не добавлены. Заказы доставляем по адресу.</p>
				{:else}
					<ul class="grid grid-cols-1 gap-4 md:grid-cols-2">
						{#each visibleLocations as location (location.id)}
							{@const hours = formatOpeningHours(location.openingHours)}
							<li class="bg-white rounded-lg shadow-md p-6">
								<div class="mb-2 flex flex-wrap items-center gap-2">
									<h3 class="font-semibold text-gray-800">{location.name}</h3>
									<span class="rounded bg-blue-100 px-2 py-1 text-xs text-blue-800">
										{typeLabels[location.type]}
									</span>
								</div>
								<p class="text-sm text-gray-600">
									{location.city}, {location.street}, д. {location.building}
									{#if location.apartment}, {location.apartment}{/if}
								</p>
								{#if location.postalCode}
									<p class="text-sm text-gray-600">Индекс: {location.postalCode}</p>
								{/if}
								<p class="mt-1 text-sm text-gray-600">
									Телефон:
									<a href={telHref(location.phone)} class="text-gray-900 hover:text-blue-600">
										{location.phone}
									</a>
								</p>
								{#if hours.length > 0}
									<div class="mt-3 text-sm text-gray-600">
										<p class="font-medium text-gray-700">График работы</p>
										<ul class="mt-1 space-y-0.5">
											{#each hours as line (line)}
												<li>{line}</li>
											{/each}
										</ul>
									</div>
								{/if}
							</li>
						{/each}
					</ul>
				{/if}
			</section>
		</div>
	{/if}
</div>
