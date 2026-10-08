<script lang="ts">
	import { siteOrigin } from '$lib/utils/site';
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

	const siteUrl = $derived(siteOrigin(page.url));
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
	<meta name="description" content="Как связаться с {siteName}: телефон, email, адреса точек самовывоза и график работы." />
	<link rel="canonical" href="{siteUrl}/contacts" />
</svelte:head>

<div class="container py-4 md:py-6">
	<h1 class="text-headline md:text-headline-lg text-balance text-ink mb-6">Контакты</h1>

	{#if !$storeSettings}
		<p class="text-body text-gray-600">Информация о магазине ещё не заполнена.</p>
	{:else}
		<div class="grid grid-cols-1 gap-3 lg:grid-cols-3 lg:items-start lg:gap-6">
			<div class="space-y-3 lg:col-span-1 lg:space-y-6">
				<!-- Связь -->
				<section class="rounded-2xl bg-surface p-5 md:p-6">
					<h2 class="text-title text-ink mb-4">Связаться с нами</h2>
					{#if hasContacts}
						<dl class="space-y-3 text-body-sm">
							{#if $storeSettings.contactPhone}
								<div>
									<dt class="text-gray-500">Телефон</dt>
									<dd class="mt-0.5">
										<a
											href={telHref($storeSettings.contactPhone)}
											class="font-medium text-gray-900 hover:text-ink"
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
											class="font-medium text-gray-900 break-all hover:text-ink"
										>
											{$storeSettings.contactEmail}
										</a>
									</dd>
								</div>
							{/if}
						</dl>
					{:else}
						<p class="text-body-sm text-gray-600">Контактные данные пока не указаны.</p>
					{/if}
				</section>

				<!-- Реквизиты -->
				{#if hasLegal}
					<section class="rounded-2xl bg-surface p-5 md:p-6">
						<h2 class="text-title text-ink mb-4">Реквизиты</h2>
						<dl class="space-y-3 text-body-sm">
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
				<h2 class="text-title text-ink mb-4">Точки самовывоза</h2>

				{#if data.locationsError}
					<div role="alert" class="notice-error">
						{data.locationsError}
					</div>
				{:else if visibleLocations.length === 0}
					<p class="text-body-sm text-gray-600">Точек самовывоза пока нет: заказы можно получить только с доставкой курьером.</p>
				{:else}
					<ul class="grid grid-cols-1 gap-3 md:grid-cols-2">
						{#each visibleLocations as location (location.id)}
							{@const hours = formatOpeningHours(location.openingHours)}
							<li class="rounded-2xl bg-surface p-5 md:p-6">
								<div class="mb-2 flex flex-wrap items-center gap-2">
									<h3 class="text-title-sm text-ink">{location.name}</h3>
									<span class="rounded-md bg-gray-100 px-2 py-0.5 text-label font-medium text-gray-700">
										{typeLabels[location.type]}
									</span>
								</div>
								<p class="text-body-sm text-gray-600">
									{location.city}, {location.street}, д. {location.building}
									{#if location.apartment}, {location.apartment}{/if}
								</p>
								{#if location.postalCode}
									<p class="text-body-sm text-gray-600">Индекс: {location.postalCode}</p>
								{/if}
								<p class="mt-1 text-body-sm text-gray-600">
									Телефон:
									<a href={telHref(location.phone)} class="text-gray-900 hover:text-ink">
										{location.phone}
									</a>
								</p>
								{#if hours.length > 0}
									<div class="mt-3 text-body-sm text-gray-600">
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
