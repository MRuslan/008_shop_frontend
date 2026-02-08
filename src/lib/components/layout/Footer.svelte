<script lang="ts">
	import { storeSettings } from '$lib/stores/store';
</script>

<footer class="bg-gray-800 text-white mt-auto">
	<div class="container mx-auto px-4 py-8">
		<div class="grid grid-cols-1 md:grid-cols-3 gap-8">
			<!-- О магазине -->
			<div>
				<h3 class="text-lg font-semibold mb-4">О магазине</h3>
				{#if $storeSettings}
					<p class="text-gray-400">{$storeSettings.name}</p>
					{#if $storeSettings.contactEmail}
						<p class="text-gray-400 mt-2">Email: {$storeSettings.contactEmail}</p>
					{/if}
					{#if $storeSettings.contactPhone}
						<p class="text-gray-400 mt-2">Телефон: {$storeSettings.contactPhone}</p>
					{/if}
				{/if}
			</div>

			<!-- Навигация -->
			<div>
				<h3 class="text-lg font-semibold mb-4">Навигация</h3>
				<ul class="space-y-2">
					<li>
						<a href="/catalog" class="text-gray-400 hover:text-white transition-colors">
							Каталог
						</a>
					</li>
					<li>
						<a href="/about" class="text-gray-400 hover:text-white transition-colors">
							О нас
						</a>
					</li>
					<li>
						<a href="/contacts" class="text-gray-400 hover:text-white transition-colors">
							Контакты
						</a>
					</li>
				</ul>
			</div>

			<!-- Правовая информация -->
			<div>
				<h3 class="text-lg font-semibold mb-4">Информация</h3>
				<ul class="space-y-2">
					<li>
						<a href="/privacy" class="text-gray-400 hover:text-white transition-colors">
							Политика конфиденциальности
						</a>
					</li>
					<li>
						<a href="/terms" class="text-gray-400 hover:text-white transition-colors">
							Условия использования
						</a>
					</li>
				</ul>
			</div>
		</div>

		<div class="border-t border-gray-700 mt-8 pt-8 text-center text-gray-400">
			<p>&copy; {new Date().getFullYear()} Все права защищены</p>
		</div>
	</div>
</footer>
