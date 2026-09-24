<script lang="ts">
	import { storeSettings } from '$lib/stores/store';

	interface FooterLink {
		href: string;
		label: string;
	}

	// Ссылки на страницы с контентом появляются, когда магазин отдаёт их адреса
	// в settings.pages.{about,privacy,terms}. Без контента ссылок нет: мёртвые ссылки хуже отсутствующих.
	const pages = $derived.by(() => {
		const raw = $storeSettings?.settings?.pages as Record<string, unknown> | undefined;
		const link = (key: string, label: string): FooterLink | null => {
			const href = raw?.[key];
			return typeof href === 'string' && href.trim() ? { href: href.trim(), label } : null;
		};
		const legal = [
			link('privacy', 'Политика конфиденциальности'),
			link('terms', 'Условия использования')
		].filter((item): item is FooterLink => item !== null);
		return { about: link('about', 'О нас'), legal };
	});

	const year = new Date().getFullYear();
</script>

<footer class="bg-gray-800 text-white mt-auto">
	<div class="container mx-auto px-4 py-8">
		<div class="grid grid-cols-1 gap-8 md:grid-cols-2 {pages.legal.length ? 'lg:grid-cols-3' : ''}">
			<!-- О магазине -->
			<div>
				<h2 class="text-lg font-semibold mb-4">О магазине</h2>
				{#if $storeSettings}
					<p class="text-gray-400">{$storeSettings.name}</p>
					{#if $storeSettings.contactEmail}
						<p class="text-gray-400 mt-2">
							Email:
							<a
								href="mailto:{$storeSettings.contactEmail}"
								class="inline-flex min-h-11 items-center hover:text-white transition-colors"
							>
								{$storeSettings.contactEmail}
							</a>
						</p>
					{/if}
					{#if $storeSettings.contactPhone}
						<p class="text-gray-400 mt-2">
							Телефон:
							<a
								href="tel:{$storeSettings.contactPhone.replace(/[^\d+]/g, '')}"
								class="inline-flex min-h-11 items-center hover:text-white transition-colors"
							>
								{$storeSettings.contactPhone}
							</a>
						</p>
					{/if}
				{/if}
			</div>

			<!-- Навигация -->
			<div>
				<h2 class="text-lg font-semibold mb-4">Навигация</h2>
				<ul class="-my-2">
					<li>
						<a href="/catalog" class="inline-flex min-h-11 items-center text-gray-400 hover:text-white transition-colors">
							Каталог
						</a>
					</li>
					{#if pages.about}
						<li>
							<a href={pages.about.href} class="inline-flex min-h-11 items-center text-gray-400 hover:text-white transition-colors">
								{pages.about.label}
							</a>
						</li>
					{/if}
					<li>
						<a href="/contacts" class="inline-flex min-h-11 items-center text-gray-400 hover:text-white transition-colors">
							Контакты
						</a>
					</li>
				</ul>
			</div>

			<!-- Правовая информация -->
			{#if pages.legal.length}
				<div>
					<h2 class="text-lg font-semibold mb-4">Информация</h2>
					<ul class="-my-2">
						{#each pages.legal as item (item.href)}
							<li>
								<a href={item.href} class="inline-flex min-h-11 items-center text-gray-400 hover:text-white transition-colors">
									{item.label}
								</a>
							</li>
						{/each}
					</ul>
				</div>
			{/if}
		</div>

		<div class="border-t border-gray-700 mt-8 pt-8 text-center text-gray-400">
			<p>&copy; {year} {$storeSettings?.legalName || $storeSettings?.name || ''} Все права защищены</p>
		</div>
	</div>
</footer>
