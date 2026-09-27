<script lang="ts">
	import type { Category, ProductFilters } from '$lib/types/product';

	interface Props {
		filters: ProductFilters;
		categories: Category[];
		onFiltersChange: (filters: ProductFilters) => void;
	}

	let { filters, categories, onFiltersChange }: Props = $props();

	const uid = $props.id();

	// Поля цены редактируются локально и применяются по Enter или уходу с поля,
	// чтобы каталог не перезагружался на каждую нажатую цифру
	let minDraft = $derived(filters.minPrice?.toString() ?? '');
	let maxDraft = $derived(filters.maxPrice?.toString() ?? '');

	const hasActiveFilters = $derived(
		filters.categoryId !== undefined ||
			filters.minPrice !== undefined ||
			filters.maxPrice !== undefined ||
			!!filters.inStock
	);

	function update(patch: Partial<ProductFilters>) {
		onFiltersChange({ ...filters, ...patch, page: 1 });
	}

	function parsePrice(value: string): number | undefined {
		const parsed = Number.parseFloat(value.replace(/\s/g, '').replace(',', '.'));
		return Number.isFinite(parsed) && parsed >= 0 ? parsed : undefined;
	}

	function applyPrice() {
		const minPrice = parsePrice(minDraft);
		const maxPrice = parsePrice(maxDraft);
		if (minPrice === filters.minPrice && maxPrice === filters.maxPrice) return;
		update({ minPrice, maxPrice });
	}

	function reset() {
		update({ categoryId: undefined, minPrice: undefined, maxPrice: undefined, inStock: undefined });
	}

	const itemClass = (active: boolean) =>
		`flex min-h-10 w-full items-center rounded-lg px-3 text-left text-sm transition-colors ${
			active ? 'bg-gray-100 font-medium text-ink' : 'text-gray-700 hover:bg-gray-50 hover:text-ink'
		}`;
</script>

<div class="space-y-6">
	<fieldset>
		<legend class="mb-2 text-sm font-semibold text-ink">Цена, ₽</legend>
		<div class="grid grid-cols-2 gap-2">
			<label class="block">
				<span class="sr-only">Цена от</span>
				<input
					type="text"
					inputmode="numeric"
					placeholder="от"
					bind:value={minDraft}
					onchange={applyPrice}
					onkeydown={(event) => event.key === 'Enter' && applyPrice()}
					class="h-11 w-full rounded-xl border-0 bg-gray-100 px-3 text-base text-ink tabular-nums lg:text-sm placeholder:text-gray-500 focus:bg-white focus:ring-2 focus:ring-ink focus:outline-none"
				/>
			</label>
			<label class="block">
				<span class="sr-only">Цена до</span>
				<input
					type="text"
					inputmode="numeric"
					placeholder="до"
					bind:value={maxDraft}
					onchange={applyPrice}
					onkeydown={(event) => event.key === 'Enter' && applyPrice()}
					class="h-11 w-full rounded-xl border-0 bg-gray-100 px-3 text-base text-ink tabular-nums lg:text-sm placeholder:text-gray-500 focus:bg-white focus:ring-2 focus:ring-ink focus:outline-none"
				/>
			</label>
		</div>
	</fieldset>

	<label class="flex min-h-11 cursor-pointer items-center justify-between gap-3">
		<span class="text-sm font-semibold text-ink">Только в наличии</span>
		<input
			type="checkbox"
			role="switch"
			checked={!!filters.inStock}
			onchange={(event) => update({ inStock: event.currentTarget.checked || undefined })}
			class="peer sr-only"
		/>
		<span
			class="relative h-7 w-12 shrink-0 rounded-full bg-gray-300 transition-colors duration-200 peer-checked:bg-ink peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-ink after:absolute after:top-1 after:left-1 after:size-5 after:rounded-full after:bg-white after:transition-transform after:duration-200 after:ease-out after:content-[''] peer-checked:after:translate-x-5"
			aria-hidden="true"
		></span>
	</label>

	<!-- Категории после цены и наличия: в листе на телефоне короткие фильтры видны без прокрутки -->
	{#if categories.length}
		<section aria-labelledby="{uid}-categories">
			<h2 id="{uid}-categories" class="mb-2 text-sm font-semibold text-ink">Категории</h2>
			<ul class="-mx-3 space-y-0.5">
				<li>
					<button
						type="button"
						class={itemClass(filters.categoryId === undefined)}
						aria-pressed={filters.categoryId === undefined}
						onclick={() => update({ categoryId: undefined })}
					>
						Все товары
					</button>
				</li>
				{#each categories as category (category.id)}
					<li>
						<button
							type="button"
							class={itemClass(filters.categoryId === category.id)}
							aria-pressed={filters.categoryId === category.id}
							onclick={() => update({ categoryId: category.id })}
						>
							{category.name}
						</button>
						{#if category.children?.length}
							<ul class="ml-3 space-y-0.5 border-l border-line pl-2">
								{#each category.children as child (child.id)}
									<li>
										<button
											type="button"
											class={itemClass(filters.categoryId === child.id)}
											aria-pressed={filters.categoryId === child.id}
											onclick={() => update({ categoryId: child.id })}
										>
											{child.name}
										</button>
									</li>
								{/each}
							</ul>
						{/if}
					</li>
				{/each}
			</ul>
		</section>
	{/if}

	{#if hasActiveFilters}
		<button
			type="button"
			onclick={reset}
			class="inline-flex min-h-11 items-center text-sm font-medium text-gray-600 underline decoration-gray-300 underline-offset-4 hover:text-ink hover:decoration-ink"
		>
			Сбросить фильтры
		</button>
	{/if}
</div>
