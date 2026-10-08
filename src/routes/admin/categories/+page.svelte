<script lang="ts">
	import Plus from '@lucide/svelte/icons/plus';
	import ActiveBadge from '$lib/components/ui/ActiveBadge.svelte';
	import { invalidateAll } from '$app/navigation';
	import { categoriesApi } from '$lib/api/categories';
	import type { Category } from '$lib/types/product';
	import { getErrorMessage } from '$lib/utils/errors';
	import { toast } from '$lib/stores/toast';
	import { confirmDialog } from '$lib/stores/confirm';

	interface Props {
		data: {
			categories: Category[];
		};
	}

	let { data }: Props = $props();

	let showCategoryForm = $state(false);
	let editingCategory = $state<Category | null>(null);
	let name = $state('');
	let slug = $state('');
	let parentId = $state<number | null>(null);
	let sortOrder = $state(0);
	let isActive = $state(true);
	let isSubmitting = $state(false);
	let error = $state<string | null>(null);

	function handleCreate() {
		editingCategory = null;
		name = '';
		slug = '';
		parentId = null;
		sortOrder = 0;
		isActive = true;
		showCategoryForm = true;
	}

	function handleEdit(category: Category) {
		editingCategory = category;
		name = category.name;
		slug = category.slug;
		parentId = category.parentId;
		sortOrder = category.sortOrder;
		isActive = category.isActive;
		showCategoryForm = true;
	}

	async function handleDelete(category: Category) {
		const confirmed = await confirmDialog({
			title: `Удалить категорию «${category.name}»?`,
			message: 'Дочерние категории станут корневыми, товары останутся без категории.',
			confirmLabel: 'Удалить',
			danger: true
		});
		if (!confirmed) return;

		try {
			await categoriesApi.deleteCategory(category.id);
			await invalidateAll();
			toast.success(`Категория «${category.name}» удалена`);
		} catch (err) {
			toast.error(getErrorMessage(err, 'Не удалось удалить категорию'));
		}
	}

	async function handleSubmit() {
		error = null;

		if (!name.trim()) {
			error = 'Название категории обязательно';
			return;
		}

		isSubmitting = true;

		try {
			const categoryData: any = {
				name: name.trim(),
				slug: slug.trim() || undefined,
				parentId: parentId || undefined,
				sortOrder,
				isActive
			};

			if (editingCategory) {
				await categoriesApi.updateCategory(editingCategory.id, categoryData);
			} else {
				await categoriesApi.createCategory(categoryData);
			}

			await invalidateAll();
			showCategoryForm = false;
			editingCategory = null;
			name = '';
			slug = '';
			parentId = null;
			sortOrder = 0;
			isActive = true;
		} catch (err) {
			error = getErrorMessage(err, 'Не удалось сохранить категорию');
		} finally {
			isSubmitting = false;
		}
	}
</script>

<svelte:head>
	<title>Управление категориями - Админ-панель</title>
</svelte:head>

<div class="rounded-2xl bg-surface p-5 md:p-6">
	<div class="flex items-center justify-between mb-6">
		<h1 class="text-headline text-ink">Управление категориями</h1>
		<button
			onclick={handleCreate}
			class="btn-primary"
		>
			<Plus class="size-4" aria-hidden="true" />
			Добавить категорию
		</button>
	</div>

	<!-- Форма категории -->
	{#if showCategoryForm}
		<!-- Форма — раздел той же панели, отделённый линией, а не вложенная карточка -->
		<div class="mb-6 border-b border-line pb-6">
			<h2 class="text-title text-ink mb-4">
				{editingCategory ? 'Редактирование категории' : 'Создание категории'}
			</h2>

			<form onsubmit={(e) => { e.preventDefault(); handleSubmit(); }} class="space-y-4">
				{#if error}
					<div role="alert" class="notice-error">
						{error}
					</div>
				{/if}

				<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
					<div>
						<label for="category-field-1" class="field-label">
							Название <span class="text-negative" aria-hidden="true">*</span>
						</label>
						<input
						id="category-field-1"
							type="text"
							bind:value={name}
							required
							class="w-full field"
						/>
					</div>

					<div>
						<label for="category-field-2" class="field-label">Slug</label>
						<input
						id="category-field-2"
							type="text"
							bind:value={slug}
							placeholder="Автоматически из названия"
							class="w-full field"
						/>
					</div>
				</div>

				<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
					<div>
						<label for="category-field-3" class="field-label">Родительская категория</label>
						<select
						id="category-field-3"
							bind:value={parentId}
							class="w-full field"
						>
							<option value={null}>Корневая категория</option>
							{#each data.categories as cat}
								{#if !editingCategory || cat.id !== editingCategory.id}
									<option value={cat.id}>{cat.name}</option>
									{#if cat.children}
										{#each cat.children as child}
											{#if !editingCategory || child.id !== editingCategory.id}
												<option value={child.id}>— {child.name}</option>
											{/if}
										{/each}
									{/if}
								{/if}
							{/each}
						</select>
					</div>

					<div>
						<label for="category-field-4" class="field-label">Порядок сортировки</label>
						<input
						id="category-field-4"
							type="number"
							bind:value={sortOrder}
							class="w-full field"
						/>
					</div>
				</div>

				<div>
					<label class="flex min-h-11 cursor-pointer items-center gap-2.5">
						<input
							type="checkbox"
							bind:checked={isActive}
							class="size-4"
						/>
						<span class="text-body-sm text-gray-800">Категория активна</span>
					</label>
				</div>

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
							showCategoryForm = false;
							editingCategory = null;
						}}
						class="btn-secondary"
					>
						Отмена
					</button>
				</div>
			</form>
		</div>
	{/if}

	<!-- Дерево категорий -->
	<div class="space-y-2">
		{#each data.categories as category}
			<div class="mb-2">
				<div class="flex items-center justify-between rounded-xl bg-gray-50 p-3 pl-4">
					<div class="flex-1">
						<div class="font-medium text-gray-900">{category.name}</div>
						<div class="text-body-sm text-gray-500">Slug: {category.slug}</div>
						<div class="flex items-center gap-2 mt-1">
							<ActiveBadge active={category.isActive} on="Активна" off="Неактивна" />
						</div>
					</div>
					<div class="flex gap-1">
						<button
							onclick={() => handleEdit(category)}
							class="btn-text"
						>
							Редактировать
						</button>
						<button
							onclick={() => handleDelete(category)}
							class="btn-text text-negative hover:text-negative"
						>
							Удалить
						</button>
					</div>
				</div>
				{#if category.children && category.children.length > 0}
					<div class="ml-6 mt-2 space-y-2">
						{#each category.children as child}
							<div class="flex items-center justify-between rounded-xl bg-gray-50 p-3 pl-4">
								<div class="flex-1">
									<div class="font-medium text-gray-900">— {child.name}</div>
									<div class="text-body-sm text-gray-500">Slug: {child.slug}</div>
									<div class="flex items-center gap-2 mt-1">
										<ActiveBadge active={child.isActive} on="Активна" off="Неактивна" />
									</div>
								</div>
								<div class="flex gap-1">
									<button
										onclick={() => handleEdit(child)}
										class="btn-text"
									>
										Редактировать
									</button>
									<button
										onclick={() => handleDelete(child)}
										class="btn-text text-negative hover:text-negative"
									>
										Удалить
									</button>
								</div>
							</div>
						{/each}
					</div>
				{/if}
			</div>
		{/each}
	</div>
</div>
