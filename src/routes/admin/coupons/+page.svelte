<script lang="ts">
	import Plus from '@lucide/svelte/icons/plus';
	import ActiveBadge from '$lib/components/ui/ActiveBadge.svelte';
	import { onMount } from 'svelte';
	import { invalidateAll } from '$app/navigation';
	import { couponsApi, type CreateCouponDto } from '$lib/api/coupons';
	import type { Coupon } from '$lib/types/common';
	import { formatDateTime, formatPrice } from '$lib/utils/format';
	import { getErrorMessage } from '$lib/utils/errors';
	import { toast } from '$lib/stores/toast';
	import { confirmDialog } from '$lib/stores/confirm';

	interface Props {
		data: {
			coupons: Coupon[];
		};
	}

	let { data }: Props = $props();

	// Локальный список: синхронизируем с data и подгружаем на клиенте при полной перезагрузке
	let coupons = $state<Coupon[]>([]);

	$effect(() => {
		if (Array.isArray(data.coupons)) {
			coupons = data.coupons;
		}
	});

	onMount(async () => {
		if (coupons.length === 0) {
			try {
				coupons = await couponsApi.getCoupons();
			} catch {
				coupons = [];
			}
		}
	});

	let showCouponForm = $state(false);
	let editingCoupon = $state<Coupon | null>(null);
	let code = $state('');
	let type = $state<'percent' | 'fixed'>('percent');
	let value = $state(0);
	let validFrom = $state('');
	let validTo = $state('');
	let isActive = $state(true);
	// Лимиты: пустое поле — без ограничения
	let maxUses = $state('');
	let maxUsesPerUser = $state('');
	let minSubtotal = $state('');
	let isSubmitting = $state(false);

	function optionalNumber(value: string | number): number | null {
		const text = String(value ?? '').trim().replace(',', '.');
		return text ? Number(text) : null;
	}
	let error = $state<string | null>(null);

	function handleCreate() {
		editingCoupon = null;
		code = '';
		type = 'percent';
		value = 0;
		validFrom = '';
		validTo = '';
		isActive = true;
		maxUses = '';
		maxUsesPerUser = '';
		minSubtotal = '';
		showCouponForm = true;
	}

	function handleEdit(coupon: Coupon) {
		editingCoupon = coupon;
		code = coupon.code;
		type = coupon.type;
		// Бэкенд отдаёт сумму строкой ("10.00"), а принимает числом
		value = parseFloat(String(coupon.value));
		validFrom = coupon.validFrom ? coupon.validFrom.split('T')[0] : '';
		validTo = coupon.validTo ? coupon.validTo.split('T')[0] : '';
		isActive = coupon.isActive;
		maxUses = coupon.maxUses?.toString() ?? '';
		maxUsesPerUser = coupon.maxUsesPerUser?.toString() ?? '';
		minSubtotal = coupon.minSubtotal ? String(parseFloat(coupon.minSubtotal)) : '';
		showCouponForm = true;
	}

	async function handleDelete(coupon: Coupon) {
		const confirmed = await confirmDialog({
			title: `Удалить купон ${coupon.code}?`,
			message: 'Покупатели больше не смогут применить этот код.',
			confirmLabel: 'Удалить',
			danger: true
		});
		if (!confirmed) return;

		try {
			await couponsApi.deleteCoupon(coupon.id);
			await invalidateAll();
			toast.success(`Купон ${coupon.code} удалён`);
		} catch (err) {
			toast.error(getErrorMessage(err, 'Не удалось удалить купон'));
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

		const limits = {
			maxUses: optionalNumber(maxUses),
			maxUsesPerUser: optionalNumber(maxUsesPerUser),
			minSubtotal: optionalNumber(minSubtotal)
		};
		if (
			[limits.maxUses, limits.maxUsesPerUser].some((n) => n !== null && (!Number.isInteger(n) || n < 1)) ||
			(limits.minSubtotal !== null && !(limits.minSubtotal >= 0))
		) {
			error = 'Лимиты применений — целые числа от 1, минимальная сумма — от 0';
			return;
		}

		isSubmitting = true;

		try {
			const couponData: CreateCouponDto = {
				...limits,
				code: code.trim().toUpperCase(),
				type,
				value,
				validFrom: validFrom || undefined,
				validTo: validTo || undefined,
				isActive
			};

			const wasEditing = Boolean(editingCoupon);
			if (editingCoupon) {
				await couponsApi.updateCoupon(editingCoupon.id, couponData);
			} else {
				await couponsApi.createCoupon(couponData);
			}

			await invalidateAll();
			showCouponForm = false;
			editingCoupon = null;
			toast.success(wasEditing ? `Купон ${couponData.code} обновлён` : `Купон ${couponData.code} создан`);
		} catch (err) {
			error = getErrorMessage(err, 'Не удалось сохранить купон');
		} finally {
			isSubmitting = false;
		}
	}
</script>

<svelte:head>
	<title>Управление купонами - Админ-панель</title>
</svelte:head>

<div class="rounded-2xl bg-surface p-5 md:p-6">
	<div class="flex items-center justify-between mb-6">
		<h1 class="text-headline text-ink">Управление купонами</h1>
		<button
			onclick={handleCreate}
			class="btn-primary"
		>
			<Plus class="size-4" aria-hidden="true" />
			Добавить купон
		</button>
	</div>

	<!-- Форма купона -->
	{#if showCouponForm}
		<!-- Форма — раздел той же панели, отделённый линией, а не вложенная карточка -->
		<div class="mb-6 border-b border-line pb-6">
			<h2 class="text-title text-ink mb-4">
				{editingCoupon ? 'Редактирование купона' : 'Создание купона'}
			</h2>

			<form onsubmit={(e) => { e.preventDefault(); handleSubmit(); }} class="space-y-4">
				{#if error}
					<div role="alert" class="notice-error">
						{error}
					</div>
				{/if}

				<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
					<div>
						<label for="coupon-field-1" class="field-label">
							Код купона <span class="text-negative" aria-hidden="true">*</span>
						</label>
						<input
						id="coupon-field-1"
							type="text"
							bind:value={code}
							required
							placeholder="PROMO2024"
							class="w-full uppercase field"
						/>
					</div>

					<div>
						<label for="coupon-field-2" class="field-label">
							Тип <span class="text-negative" aria-hidden="true">*</span>
						</label>
						<select
						id="coupon-field-2"
							bind:value={type}
							class="w-full field"
						>
							<option value="percent">Процент</option>
							<option value="fixed">Фиксированная сумма</option>
						</select>
					</div>
				</div>

				<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
					<div>
						<label for="coupon-field-3" class="field-label">
							Значение <span class="text-negative" aria-hidden="true">*</span>
						</label>
						<input
						id="coupon-field-3"
							type="number"
							bind:value={value}
							min="0"
							step="0.01"
							required
							placeholder={type === 'percent' ? '10' : '1000'}
							class="w-full field"
						/>
						<p class="text-label text-gray-500 mt-1">
							{type === 'percent' ? 'Процент скидки (0-100)' : 'Сумма скидки'}
						</p>
					</div>

					<div>
						<label for="coupon-field-4" class="field-label">Активен</label>
						<label class="mt-1 flex min-h-11 cursor-pointer items-center gap-2.5">
							<input
						id="coupon-field-4"
								type="checkbox"
								bind:checked={isActive}
								class="size-4"
							/>
							<span class="text-body-sm text-gray-800">Купон активен</span>
						</label>
					</div>
				</div>

				<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
					<div>
						<label for="coupon-field-5" class="field-label">Действует с</label>
						<input
						id="coupon-field-5"
							type="date"
							bind:value={validFrom}
							class="w-full field"
						/>
					</div>

					<div>
						<label for="coupon-field-6" class="field-label">Действует до</label>
						<input
						id="coupon-field-6"
							type="date"
							bind:value={validTo}
							class="w-full field"
						/>
					</div>
				</div>

				<fieldset class="min-w-0 border-0 p-0">
					<legend class="mb-3 text-title-sm text-ink">Ограничения <span class="font-normal text-gray-500">(пустое поле — без ограничения)</span></legend>
					<div class="grid grid-cols-1 md:grid-cols-3 gap-4">
						<div>
							<label for="coupon-max-uses" class="block text-body-sm text-gray-700 mb-1">Всего применений</label>
							<input id="coupon-max-uses" type="number" min="1" step="1" bind:value={maxUses} class="w-full field" />
						</div>
						<div>
							<label for="coupon-max-per-user" class="block text-body-sm text-gray-700 mb-1">На одного покупателя</label>
							<input id="coupon-max-per-user" type="number" min="1" step="1" bind:value={maxUsesPerUser} class="w-full field" />
						</div>
						<div>
							<label for="coupon-min-subtotal" class="block text-body-sm text-gray-700 mb-1">Заказ от, ₽</label>
							<input id="coupon-min-subtotal" type="number" min="0" step="0.01" bind:value={minSubtotal} class="w-full field" />
						</div>
					</div>
				</fieldset>

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
							showCouponForm = false;
							editingCoupon = null;
						}}
						class="btn-secondary"
					>
						Отмена
					</button>
				</div>
			</form>
		</div>
	{/if}

	<!-- Таблица купонов -->
	<div class="overflow-x-auto">
		<table class="min-w-full divide-y divide-line text-left">
			<thead class="bg-gray-50">
				<tr>
					<th class="text-left font-medium text-gray-500 px-4 py-3 text-label">Код</th>
					<th class="text-left font-medium text-gray-500 px-4 py-3 text-label">Тип</th>
					<th class="text-left font-medium text-gray-500 px-4 py-3 text-label">Значение</th>
					<th class="text-left font-medium text-gray-500 px-4 py-3 text-label">Период действия</th>
					<th class="text-left font-medium text-gray-500 px-4 py-3 text-label">Применений</th>
					<th class="text-left font-medium text-gray-500 px-4 py-3 text-label">Статус</th>
					<th class="text-right font-medium text-gray-500 px-4 py-3 text-label">Действия</th>
				</tr>
			</thead>
			<tbody class="divide-y divide-line">
				{#each coupons as coupon}
					<tr class="hover:bg-gray-50">
						<td class="whitespace-nowrap text-body-sm font-medium text-gray-900 px-4 py-3">
							{coupon.code}
						</td>
						<td class="whitespace-nowrap text-body-sm text-gray-500 px-4 py-3">
							{coupon.type === 'percent' ? 'Процент' : 'Фиксированная'}
						</td>
						<td class="whitespace-nowrap text-body-sm text-gray-900 px-4 py-3">
							{coupon.type === 'percent' ? `${parseFloat(coupon.value)}%` : formatPrice(coupon.value)}
							{#if coupon.minSubtotal}
								<span class="block text-label text-gray-500">от {formatPrice(coupon.minSubtotal)}</span>
							{/if}
						</td>
						<td class="whitespace-nowrap text-body-sm text-gray-500 px-4 py-3">
							{#if coupon.validFrom || coupon.validTo}
								{coupon.validFrom ? formatDateTime(coupon.validFrom) : '—'} - {coupon.validTo ? formatDateTime(coupon.validTo) : '—'}
							{:else}
								Без ограничений
							{/if}
						</td>
						<td class="whitespace-nowrap text-body-sm text-gray-700 tabular-nums px-4 py-3">
							{coupon.usedCount ?? 0}{coupon.maxUses ? ` из ${coupon.maxUses}` : ''}
							{#if coupon.maxUsesPerUser}
								<span class="block text-label text-gray-500">до {coupon.maxUsesPerUser} на покупателя</span>
							{/if}
						</td>
						<td class="whitespace-nowrap px-4 py-3">
							<ActiveBadge active={coupon.isActive} on="Активен" off="Неактивен" />
						</td>
						<td class="whitespace-nowrap text-right text-body-sm font-medium px-4 py-3">
							<div class="flex justify-end gap-1">
								<button
									onclick={() => handleEdit(coupon)}
									class="btn-text"
								>
									Редактировать
								</button>
								<button
									onclick={() => handleDelete(coupon)}
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

	{#if coupons.length === 0}
		<div class="text-center py-8 text-gray-500">
			Купоны не найдены
		</div>
	{/if}
</div>
