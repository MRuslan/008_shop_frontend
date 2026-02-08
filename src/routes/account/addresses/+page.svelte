<script lang="ts">
	import { onMount } from 'svelte';
	import { addressesApi } from '$lib/api/addresses';
	import type { Address, CreateAddressDto, UpdateAddressDto } from '$lib/types/common';
	import AddressList from '$lib/components/checkout/AddressList.svelte';
	import AddressForm from '$lib/components/checkout/AddressForm.svelte';

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
		} catch (err: any) {
			error = err.message || 'Ошибка загрузки адресов';
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
		} catch (err: any) {
			throw new Error(err.message || 'Ошибка сохранения адреса');
		}
	}

	async function handleDeleteAddress(addressId: number) {
		try {
			await addressesApi.deleteAddress(addressId);
			await loadAddresses();
		} catch (err: any) {
			error = err.message || 'Ошибка удаления адреса';
		}
	}

	async function handleSetDefault(addressId: number) {
		try {
			await addressesApi.setDefaultAddress(addressId);
			await loadAddresses();
		} catch (err: any) {
			error = err.message || 'Ошибка установки адреса по умолчанию';
		}
	}
</script>

<svelte:head>
	<title>Адреса доставки - Личный кабинет</title>
	<meta name="description" content="Управление адресами доставки" />
</svelte:head>

<div class="bg-white rounded-lg shadow-md p-6">
	<div class="flex items-center justify-between mb-6">
		<h1 class="text-2xl font-bold text-gray-800">Адреса доставки</h1>
		{#if !showAddressForm}
			<button
				onclick={() => {
					editingAddress = null;
					showAddressForm = true;
				}}
				class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
			>
				+ Добавить адрес
			</button>
		{/if}
	</div>

	{#if error}
		<div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
			{error}
		</div>
	{/if}

	{#if isLoading}
		<div class="text-center py-12">
			<p class="text-gray-500">Загрузка адресов...</p>
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
			<p class="text-gray-500 mb-4">У вас пока нет сохранённых адресов</p>
			<button
				onclick={() => {
					editingAddress = null;
					showAddressForm = true;
				}}
				class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
			>
				Добавить первый адрес
			</button>
		</div>
	{:else}
		<AddressList
			{addresses}
			selectedAddressId={null}
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
		
		<div class="mt-4 text-sm text-gray-600">
			<p>💡 Нажмите на адрес, чтобы установить его по умолчанию</p>
		</div>
	{/if}
</div>
