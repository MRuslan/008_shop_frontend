<script lang="ts">
	import { couponsApi } from '$lib/api/coupons';
	import type { Coupon, CreateCouponDto } from '$lib/types/common';
	import { formatDateTime } from '$lib/utils/format';

	interface Props {
		data: {
			coupons: Coupon[];
		};
	}

	let { data }: Props = $props();

	let showCouponForm = $state(false);
	let editingCoupon = $state<Coupon | null>(null);
	let code = $state('');
	let type = $state<'percent' | 'fixed'>('percent');
	let value = $state(0);
	let validFrom = $state('');
	let validTo = $state('');
	let isActive = $state(true);
	let isSubmitting = $state(false);
	let error = $state<string | null>(null);

	function handleCreate() {
		editingCoupon = null;
		code = '';
		type = 'percent';
		value = 0;
		validFrom = '';
		validTo = '';
		isActive = true;
		showCouponForm = true;
	}

	function handleEdit(coupon: Coupon) {
		editingCoupon = coupon;
		code = coupon.code;
		type = coupon.type;
		value = coupon.value;
		validFrom = coupon.validFrom ? coupon.validFrom.split('T')[0] : '';
		validTo = coupon.validTo ? coupon.validTo.split('T')[0] : '';
		isActive = coupon.isActive;
		showCouponForm = true;
	}

	async function handleDelete(couponId: number) {
		if (!confirm('Удалить купон?')) return;

		try {
			await couponsApi.deleteCoupon(couponId);
			window.location.reload();
		} catch (error: any) {
			alert(error.message || 'Ошибка удаления купона');
		}
	}

	async function handleSubmit() {
		error = null;

		if (!code.trim()) {
			error = 'Код купона обязателен';
			return;
		}

		if (value <= 0) {
			error = 'Значение должно быть больше 0';
			return;
		}

		if (type === 'percent' && value > 100) {
			error = 'Процент скидки не может быть больше 100';
			return;
		}

		isSubmitting = true;

		try {
			const couponData: CreateCouponDto = {
				code: code.trim().toUpperCase(),
				type,
				value,
				validFrom: validFrom || undefined,
				validTo: validTo || undefined,
				isActive
			};

			if (editingCoupon) {
				await couponsApi.updateCoupon(editingCoupon.id, couponData);
			} else {
				await couponsApi.createCoupon(couponData);
			}

			window.location.reload();
		} catch (err: any) {
			const message = err.message || 'Ошибка сохранения купона';
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
	<title>Управление купонами - Админ-панель</title>
</svelte:head>

<div class="bg-white rounded-lg shadow-md p-6">
	<div class="flex items-center justify-between mb-6">
		<h1 class="text-2xl font-bold text-gray-800">Управление купонами</h1>
		<button
			onclick={handleCreate}
			class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
		>
			+ Добавить купон
		</button>
	</div>

	<!-- Форма купона -->
	{#if showCouponForm}
		<div class="mb-6 bg-gray-50 rounded-lg p-6 border-2 border-blue-500">
			<h2 class="text-xl font-semibold text-gray-800 mb-4">
				{editingCoupon ? 'Редактирование купона' : 'Создание купона'}
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
							Код купона <span class="text-red-500">*</span>
						</label>
						<input
							type="text"
							bind:value={code}
							required
							placeholder="PROMO2024"
							class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 uppercase"
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
							<option value="percent">Процент</option>
							<option value="fixed">Фиксированная сумма</option>
						</select>
					</div>
				</div>

				<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
					<div>
						<label class="block text-sm font-medium text-gray-700 mb-1">
							Значение <span class="text-red-500">*</span>
						</label>
						<input
							type="number"
							bind:value={value}
							min="0"
							step="0.01"
							required
							placeholder={type === 'percent' ? '10' : '1000'}
							class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
						/>
						<p class="text-xs text-gray-500 mt-1">
							{type === 'percent' ? 'Процент скидки (0-100)' : 'Сумма скидки'}
						</p>
					</div>

					<div>
						<label class="block text-sm font-medium text-gray-700 mb-1">Активен</label>
						<label class="flex items-center space-x-2 mt-2">
							<input
								type="checkbox"
								bind:checked={isActive}
								class="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
							/>
							<span class="text-sm text-gray-700">Купон активен</span>
						</label>
					</div>
				</div>

				<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
					<div>
						<label class="block text-sm font-medium text-gray-700 mb-1">Действует с</label>
						<input
							type="date"
							bind:value={validFrom}
							class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
						/>
					</div>

					<div>
						<label class="block text-sm font-medium text-gray-700 mb-1">Действует до</label>
						<input
							type="date"
							bind:value={validTo}
							class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
						/>
					</div>
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
							showCouponForm = false;
							editingCoupon = null;
						}}
						class="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
					>
						Отмена
					</button>
				</div>
			</form>
		</div>
	{/if}

	<!-- Таблица купонов -->
	<div class="overflow-x-auto">
		<table class="min-w-full divide-y divide-gray-200">
			<thead class="bg-gray-50">
				<tr>
					<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Код</th>
					<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Тип</th>
					<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Значение</th>
					<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Период действия</th>
					<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Статус</th>
					<th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Действия</th>
				</tr>
			</thead>
			<tbody class="bg-white divide-y divide-gray-200">
				{#each data.coupons as coupon}
					<tr class="hover:bg-gray-50">
						<td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
							{coupon.code}
						</td>
						<td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
							{coupon.type === 'percent' ? 'Процент' : 'Фиксированная'}
						</td>
						<td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
							{coupon.type === 'percent' ? `${coupon.value}%` : coupon.value}
						</td>
						<td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
							{#if coupon.validFrom || coupon.validTo}
								{coupon.validFrom ? formatDateTime(coupon.validFrom) : '—'} - {coupon.validTo ? formatDateTime(coupon.validTo) : '—'}
							{:else}
								Без ограничений
							{/if}
						</td>
						<td class="px-6 py-4 whitespace-nowrap">
							<span
								class="px-2 py-1 text-xs font-medium rounded-full"
								class:bg-green-100={coupon.isActive}
								class:text-green-800={coupon.isActive}
								class:bg-red-100={!coupon.isActive}
								class:text-red-800={!coupon.isActive}
							>
								{coupon.isActive ? 'Активен' : 'Неактивен'}
							</span>
						</td>
						<td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
							<div class="flex justify-end space-x-2">
								<button
									onclick={() => handleEdit(coupon)}
									class="text-indigo-600 hover:text-indigo-900"
								>
									Редактировать
								</button>
								<button
									onclick={() => handleDelete(coupon.id)}
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

	{#if data.coupons.length === 0}
		<div class="text-center py-8 text-gray-500">
			Купоны не найдены
		</div>
	{/if}
</div>
