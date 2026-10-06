<script lang="ts">
	import { onMount } from 'svelte';
	import { addressesApi } from '$lib/api/addresses';
	import type { Address, CreateAddressDto, UpdateAddressDto } from '$lib/types/common';
	import AddressList from '$lib/components/checkout/AddressList.svelte';
	import AddressForm from '$lib/components/checkout/AddressForm.svelte';
	import Skeleton from '$lib/components/ui/Skeleton.svelte';
	import { getErrorMessage } from '$lib/utils/errors';

	let addresses = $state<Address[]>([]);
	let isLoading = $state(true);
	let error = $state<string | null>(null);
	let showAddressForm = $state(false);
	let editingAddress = $state<Address | null>(null);

	onMount(async () => {
		await loadAddresses();
	});

	async function loadAddresses() {
		isLoading = true;
		error = null;

		try {
			addresses = await addressesApi.getAddresses();
		} catch (err) {
			error = getErrorMessage(err, 'Не удалось загрузить адреса.');
		} finally {
			isLoading = false;
		}
	}

	async function handleSaveAddress(data: CreateAddressDto | UpdateAddressDto) {
		try {
			if (editingAddress) {
				await addressesApi.updateAddress(editingAddress.id, data);
			} else {
				await addressesApi.createAddress(data as CreateAddressDto);
			}
			
			await loadAddresses();
			showAddressForm = false;
			editingAddress = null;
		} catch (err) {
			throw new Error(getErrorMessage(err, 'Не удалось сохранить адрес. Попробуйте ещё раз.'));
		}
	}

	async function handleDeleteAddress(addressId: number) {
		try {
			await addressesApi.deleteAddress(addressId);
			await loadAddresses();
		} catch (err) {
			error = getErrorMessage(err, 'Не удалось удалить адрес. Попробуйте ещё раз.');
		}
	}

	async function handleSetDefault(addressId: number) {
		try {
			await addressesApi.setDefaultAddress(addressId);
			await loadAddresses();
		} catch (err) {
			error = getErrorMessage(err, 'Не удалось сменить основной адрес. Попробуйте ещё раз.');
		}
	}
</script>

<svelte:head>
	<title>Адреса доставки — Личный кабинет</title>
	<meta name="robots" content="noindex" />
</svelte:head>

<div class="bg-white rounded-lg shadow-md p-6">
	<div class="flex items-center justify-between mb-6">
		<h1 class="text-headline text-ink">Адреса доставки</h1>
		{#if !showAddressForm}
			<button
				type="button"
				onclick={() => {
					editingAddress = null;
					showAddressForm = true;
				}}
				class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-control"
			>
				Добавить адрес
			</button>
		{/if}
	</div>

	{#if error}
		<div role="alert" class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
			{error}
		</div>
	{/if}

	{#if isLoading}
		<!-- Заглушка в форме карточек адресов -->
		<div class="flex flex-col gap-3" role="status">
			<span class="sr-only">Загружаем адреса…</span>
			<Skeleton class="h-28 rounded-lg" />
			<Skeleton class="h-28 rounded-lg" />
		</div>
	{:else if showAddressForm}
		<AddressForm
			address={editingAddress}
			onSave={handleSaveAddress}
			onCancel={() => {
				showAddressForm = false;
				editingAddress = null;
			}}
		/>
	{:else if addresses.length === 0}
		<div class="text-center py-12">
			<p class="text-title-sm text-ink">Сохранённых адресов пока нет</p>
				<p class="mt-1 mb-4 text-body-sm text-gray-600">Добавьте адрес, и он подставится при оформлении заказа.</p>
			<button
				type="button"
				onclick={() => {
					editingAddress = null;
					showAddressForm = true;
				}}
				class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-control"
			>
				Добавить адрес
			</button>
		</div>
	{:else}
		<AddressList
			{addresses}
			selectedAddressId={addresses.find((a) => a.isDefault)?.id ?? null}
			legend="Основной адрес для заказов"
			onSelect={(id) => handleSetDefault(id)}
			onEdit={(address) => {
				editingAddress = address;
				showAddressForm = true;
			}}
			onDelete={handleDeleteAddress}
			onAddNew={() => {
				editingAddress = null;
				showAddressForm = true;
			}}
		/>
		
		<p class="mt-4 text-sm text-gray-600">
			Основной адрес подставляется в новые заказы автоматически.
		</p>
	{/if}
</div>
