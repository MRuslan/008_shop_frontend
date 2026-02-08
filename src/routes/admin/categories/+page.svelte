<script lang="ts">
	import { invalidateAll } from '$app/navigation';
	import { categoriesApi } from '$lib/api/categories';
	import type { Category } from '$lib/types/product';

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

	async function handleDelete(categoryId: number) {
		if (!confirm('Удалить категорию? Дочерние категории станут корневыми.')) return;

		try {
			await categoriesApi.deleteCategory(categoryId);
			await invalidateAll();
		} catch (error: any) {
			alert(error.message || 'Ошибка удаления категории');
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
		} catch (err: any) {
			const message = err.message || 'Ошибка сохранения категории';
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
	<title>Управление категориями - Админ-панель</title>
</svelte:head>

<div class="bg-white rounded-lg shadow-md p-6">
	<div class="flex items-center justify-between mb-6">
		<h1 class="text-2xl font-bold text-gray-800">Управление категориями</h1>
		<button
			onclick={handleCreate}
			class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
		>
			+ Добавить категорию
		</button>
	</div>

	<!-- Форма категории -->
	{#if showCategoryForm}
		<div class="mb-6 bg-gray-50 rounded-lg p-6 border-2 border-blue-500">
			<h2 class="text-xl font-semibold text-gray-800 mb-4">
				{editingCategory ? 'Редактирование категории' : 'Создание категории'}
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
							Название <span class="text-red-500">*</span>
						</label>
						<input
							type="text"
							bind:value={name}
							required
							class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
						/>
					</div>

					<div>
						<label class="block text-sm font-medium text-gray-700 mb-1">Slug</label>
						<input
							type="text"
							bind:value={slug}
							placeholder="Автоматически из названия"
							class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
						/>
					</div>
				</div>

				<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
					<div>
						<label class="block text-sm font-medium text-gray-700 mb-1">Родительская категория</label>
						<select
							bind:value={parentId}
							class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
						<label class="block text-sm font-medium text-gray-700 mb-1">Порядок сортировки</label>
						<input
							type="number"
							bind:value={sortOrder}
							class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
						/>
					</div>
				</div>

				<div>
					<label class="flex items-center space-x-2">
						<input
							type="checkbox"
							bind:checked={isActive}
							class="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
						/>
						<span class="text-sm text-gray-700">Категория активна</span>
					</label>
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
							showCategoryForm = false;
							editingCategory = null;
						}}
						class="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
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
				<div class="flex items-center justify-between p-3 bg-white border border-gray-200 rounded">
					<div class="flex-1">
						<div class="font-medium text-gray-900">{category.name}</div>
						<div class="text-sm text-gray-500">Slug: {category.slug}</div>
						<div class="flex items-center space-x-2 mt-1">
							<span
								class="px-2 py-1 text-xs rounded"
								class:bg-green-100={category.isActive}
								class:text-green-800={category.isActive}
								class:bg-red-100={!category.isActive}
								class:text-red-800={!category.isActive}
							>
								{category.isActive ? 'Активна' : 'Неактивна'}
							</span>
						</div>
					</div>
					<div class="flex space-x-2">
						<button
							onclick={() => handleEdit(category)}
							class="px-3 py-1 text-indigo-600 hover:text-indigo-900 text-sm"
						>
							Редактировать
						</button>
						<button
							onclick={() => handleDelete(category.id)}
							class="px-3 py-1 text-red-600 hover:text-red-900 text-sm"
						>
							Удалить
						</button>
					</div>
				</div>
				{#if category.children && category.children.length > 0}
					<div class="ml-6 mt-2 space-y-2">
						{#each category.children as child}
							<div class="flex items-center justify-between p-3 bg-gray-50 border border-gray-200 rounded">
								<div class="flex-1">
									<div class="font-medium text-gray-900">— {child.name}</div>
									<div class="text-sm text-gray-500">Slug: {child.slug}</div>
									<div class="flex items-center space-x-2 mt-1">
										<span
											class="px-2 py-1 text-xs rounded"
											class:bg-green-100={child.isActive}
											class:text-green-800={child.isActive}
											class:bg-red-100={!child.isActive}
											class:text-red-800={!child.isActive}
										>
											{child.isActive ? 'Активна' : 'Неактивна'}
										</span>
									</div>
								</div>
								<div class="flex space-x-2">
									<button
										onclick={() => handleEdit(child)}
										class="px-3 py-1 text-indigo-600 hover:text-indigo-900 text-sm"
									>
										Редактировать
									</button>
									<button
										onclick={() => handleDelete(child.id)}
										class="px-3 py-1 text-red-600 hover:text-red-900 text-sm"
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
