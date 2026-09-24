<script lang="ts">
	import { storeSettings } from '$lib/stores/store';
	import Phone from '@lucide/svelte/icons/phone';
	import Mail from '@lucide/svelte/icons/mail';

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

<!-- Подвал светлый: чёрный в этой системе закреплён за действиями, а не за второстепенным текстом -->
<footer class="mt-12 border-t border-line bg-surface text-sm text-gray-600">
	<div class="container py-8 md:py-10">
		<div class="grid grid-cols-1 gap-8 sm:grid-cols-2 {pages.legal.length ? 'lg:grid-cols-3' : ''}">
			<div>
				<h2 class="text-base font-semibold text-ink">{$storeSettings?.name || 'Магазин'}</h2>
				<ul class="mt-2">
					{#if $storeSettings?.contactPhone}
						<li>
							<a
								href="tel:{$storeSettings.contactPhone.replace(/[^\d+]/g, '')}"
								class="inline-flex min-h-11 items-center gap-2 transition-colors hover:text-ink"
							>
								<Phone class="size-4 text-gray-400" aria-hidden="true" />
								{$storeSettings.contactPhone}
							</a>
						</li>
					{/if}
					{#if $storeSettings?.contactEmail}
						<li>
							<a
								href="mailto:{$storeSettings.contactEmail}"
								class="inline-flex min-h-11 items-center gap-2 transition-colors hover:text-ink"
							>
								<Mail class="size-4 text-gray-400" aria-hidden="true" />
								{$storeSettings.contactEmail}
							</a>
						</li>
					{/if}
				</ul>
			</div>

			<div>
				<h2 class="text-base font-semibold text-ink">Покупателям</h2>
				<ul class="mt-2">
					<li>
						<a href="/catalog" class="inline-flex min-h-11 items-center transition-colors hover:text-ink">Каталог</a>
					</li>
					<li>
						<a href="/contacts" class="inline-flex min-h-11 items-center transition-colors hover:text-ink">
							Контакты и пункты выдачи
						</a>
					</li>
					{#if pages.about}
						<li>
							<a href={pages.about.href} class="inline-flex min-h-11 items-center transition-colors hover:text-ink">
								{pages.about.label}
							</a>
						</li>
					{/if}
				</ul>
			</div>

			{#if pages.legal.length}
				<div>
					<h2 class="text-base font-semibold text-ink">Информация</h2>
					<ul class="mt-2">
						{#each pages.legal as item (item.href)}
							<li>
								<a href={item.href} class="inline-flex min-h-11 items-center transition-colors hover:text-ink">
									{item.label}
								</a>
							</li>
						{/each}
					</ul>
				</div>
			{/if}
		</div>

		<p class="mt-8 border-t border-line pt-6 text-gray-500">
			© {year} {$storeSettings?.legalName || $storeSettings?.name || ''}
		</p>
	</div>
</footer>
