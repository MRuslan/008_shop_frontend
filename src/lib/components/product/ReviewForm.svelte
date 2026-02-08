<script lang="ts">
	import { reviewsApi } from '$lib/api/reviews';
	import { authStore } from '$lib/stores/auth';
	import type { CreateReviewDto } from '$lib/types/common';

	interface Props {
		productId: number;
		onReviewAdded: () => void;
	}

	let { productId, onReviewAdded }: Props = $props();

	let rating = $state(0);
	let text = $state('');
	let isSubmitting = $state(false);
	let error = $state<string | null>(null);

	async function handleSubmit() {
		if (rating === 0) {
			error = 'Выберите оценку';
			return;
		}

		isSubmitting = true;
		error = null;

		try {
			const data: CreateReviewDto = {
				productId,
				rating,
				text: text.trim() || undefined
			};

			await reviewsApi.createReview(data);
			
			// Очищаем форму
			rating = 0;
			text = '';
			
			// Обновляем список отзывов
			onReviewAdded();
		} catch (err: any) {
			const message = err.message || 'Ошибка при добавлении отзыва';
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

{#if $authStore.isAuthenticated}
	<div class="bg-white rounded-lg shadow-md p-6">
		<h3 class="text-lg font-semibold text-gray-800 mb-4">Оставить отзыв</h3>

		<form onsubmit={(e) => { e.preventDefault(); handleSubmit(); }} class="space-y-4">
			{#if error}
				<div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
					{error}
				</div>
			{/if}

			<!-- Оценка -->
			<div>
				<label class="block text-sm font-medium text-gray-700 mb-2">
					Оценка <span class="text-red-500">*</span>
				</label>
				<div class="flex items-center space-x-2">
					{#each Array.from({ length: 5 }, (_, i) => i + 1) as star}
						<button
							type="button"
							onclick={() => rating = star}
							class="focus:outline-none transition-transform hover:scale-110"
							aria-label="Оценка {star}"
						>
							<svg
								class="w-8 h-8"
								fill={star <= rating ? 'currentColor' : 'none'}
								stroke="currentColor"
								viewBox="0 0 24 24"
								class:text-yellow-400={star <= rating}
								class:text-gray-300={star > rating}
							>
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
								/>
							</svg>
						</button>
					{/each}
					{#if rating > 0}
						<span class="ml-2 text-sm text-gray-600">{rating} из 5</span>
					{/if}
				</div>
			</div>

			<!-- Текст отзыва -->
			<div>
				<label for="review-text" class="block text-sm font-medium text-gray-700 mb-1">
					Комментарий (необязательно)
				</label>
				<textarea
					id="review-text"
					bind:value={text}
					rows="4"
					placeholder="Поделитесь своим мнением о товаре..."
					class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
				></textarea>
			</div>

			<button
				type="submit"
				disabled={isSubmitting || rating === 0}
				class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
			>
				{isSubmitting ? 'Отправка...' : 'Отправить отзыв'}
			</button>
		</form>
	</div>
{:else}
	<div class="bg-gray-50 rounded-lg p-6 text-center">
		<p class="text-gray-600 mb-4">Войдите, чтобы оставить отзыв</p>
		<button
			onclick={() => window.dispatchEvent(new CustomEvent('open-auth-modal'))}
			class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
		>
			Войти
		</button>
	</div>
{/if}
