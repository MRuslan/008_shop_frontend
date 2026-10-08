<script lang="ts">
	import { reviewsApi } from '$lib/api/reviews';
	import { authStore } from '$lib/stores/auth';
	import type { CreateReviewDto } from '$lib/types/common';
	import { getErrorMessage } from '$lib/utils/errors';
	import Star from '@lucide/svelte/icons/star';

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
			error = 'Поставьте оценку от 1 до 5.';
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
		} catch (err) {
			error = getErrorMessage(err, 'Не удалось опубликовать отзыв. Попробуйте ещё раз.');
		} finally {
			isSubmitting = false;
		}
	}
</script>

{#if $authStore.isAuthenticated}
	<div class="rounded-2xl bg-surface p-5 md:p-6">
		<h3 class="text-title text-ink mb-4">Ваш отзыв</h3>

		<form onsubmit={(e) => { e.preventDefault(); handleSubmit(); }} class="space-y-4">
			{#if error}
				<div role="alert" class="notice-error">
					{error}
				</div>
			{/if}

			<!-- Оценка -->
			<div role="group" aria-labelledby="review-rating-label">
				<p id="review-rating-label" class="field-label">Оценка</p>
				<div class="flex items-center gap-1">
					{#each Array.from({ length: 5 }, (_, i) => i + 1) as star (star)}
						<button
							type="button"
							onclick={() => rating = star}
							class="inline-flex size-11 items-center justify-center rounded-xl transition-colors hover:bg-gray-100"
							aria-label="{star} из 5"
							aria-pressed={star === rating}
						>
							<!-- Звёзды графитом, как в рейтинге карточки: жёлтого в палитре нет -->
							<Star
								class="size-7 {star <= rating ? 'text-ink' : 'text-gray-300'}"
								fill={star <= rating ? 'currentColor' : 'none'}
								strokeWidth={1.5}
								aria-hidden="true"
							/>
						</button>
					{/each}
					{#if rating > 0}
						<span class="ml-2 text-body-sm text-gray-600">{rating} из 5</span>
					{/if}
				</div>
			</div>

			<!-- Текст отзыва -->
			<div>
				<label for="review-text" class="field-label">
					Текст отзыва <span class="font-normal text-gray-500">(необязательно)</span>
				</label>
				<textarea
					id="review-text"
					bind:value={text}
					rows="4"
					placeholder="Что понравилось, что нет, как товар показал себя в деле"
					class="w-full field"
				></textarea>
			</div>

			<button
				type="submit"
				disabled={isSubmitting}
				class="btn-primary"
			>
				{isSubmitting ? 'Публикуем…' : 'Опубликовать отзыв'}
			</button>
		</form>
	</div>
{:else}
	<div class="rounded-xl bg-gray-50 p-5 text-center">
		<p class="mb-4 text-body text-gray-600">Чтобы написать отзыв, войдите в аккаунт.</p>
		<button
			type="button"
			onclick={() => window.dispatchEvent(new CustomEvent('open-auth-modal', { detail: { reason: 'Войдите, чтобы написать отзыв о товаре.' } }))}
			class="btn-primary"
		>
			Войти
		</button>
	</div>
{/if}
