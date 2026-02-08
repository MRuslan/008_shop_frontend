<script lang="ts">
	import { onMount } from 'svelte';
	import { reviewsApi } from '$lib/api/reviews';
	import { authStore, hasRole } from '$lib/stores/auth';
	import type { Review } from '$lib/types/common';
	import { formatDateTime } from '$lib/utils/format';
	import ReviewForm from './ReviewForm.svelte';

	interface Props {
		productId: number;
	}

	let { productId }: Props = $props();

	let reviews = $state<Review[]>([]);
	let isLoading = $state(true);
	let error = $state<string | null>(null);
	let showReviewForm = $state(false);

	onMount(async () => {
		await loadReviews();
	});

	async function loadReviews() {
		isLoading = true;
		error = null;

		try {
			const allReviews = await reviewsApi.getReviewsByProduct(productId);
			// Показываем только видимые отзывы
			reviews = allReviews.filter((review) => review.isVisible);
		} catch (err: any) {
			error = err.message || 'Ошибка загрузки отзывов';
		} finally {
			isLoading = false;
		}
	}

	async function handleDeleteReview(reviewId: number) {
		if (!confirm('Удалить отзыв?')) return;

		try {
			await reviewsApi.deleteReview(reviewId);
			await loadReviews();
		} catch (err: any) {
			error = err.message || 'Ошибка удаления отзыва';
		}
	}

	async function handleModerateReview(reviewId: number, isVisible: boolean) {
		try {
			await reviewsApi.moderateReview(reviewId, isVisible);
			await loadReviews();
		} catch (err: any) {
			error = err.message || 'Ошибка модерации отзыва';
		}
	}

</script>

<div class="space-y-6">
	<!-- Заголовок и кнопка добавления -->
	<div class="flex items-center justify-between">
		<h2 class="text-2xl font-bold text-gray-800">
			Отзывы
			{#if reviews.length > 0}
				<span class="text-lg font-normal text-gray-500">({reviews.length})</span>
			{/if}
		</h2>
		{#if $authStore.isAuthenticated && !showReviewForm}
			<button
				onclick={() => showReviewForm = true}
				class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
			>
				Написать отзыв
			</button>
		{/if}
	</div>

	<!-- Форма добавления отзыва -->
	{#if showReviewForm}
		<ReviewForm
			{productId}
			onReviewAdded={() => {
				showReviewForm = false;
				loadReviews();
			}}
		/>
	{/if}

	<!-- Список отзывов -->
	{#if isLoading}
		<div class="text-center py-8">
			<p class="text-gray-500">Загрузка отзывов...</p>
		</div>
	{:else if error}
		<div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
			{error}
		</div>
	{:else if reviews.length === 0}
		<div class="text-center py-8 bg-gray-50 rounded-lg">
			<p class="text-gray-500">Пока нет отзывов. Будьте первым!</p>
		</div>
	{:else}
		<div class="space-y-4">
			{#each reviews as review (review.id)}
				<div class="bg-white rounded-lg shadow-md p-6">
					<div class="flex items-start justify-between mb-4">
						<div class="flex-1">
							<div class="flex items-center space-x-3 mb-2">
								<h3 class="font-semibold text-gray-800">
									{review.user?.username || 'Анонимный пользователь'}
								</h3>
								<div class="flex items-center space-x-1">
									{#each Array.from({ length: 5 }, (_, i) => i + 1) as star}
										<svg
											class="w-4 h-4"
											fill={star <= review.rating ? 'currentColor' : 'none'}
											stroke="currentColor"
											viewBox="0 0 24 24"
											class:text-yellow-400={star <= review.rating}
											class:text-gray-300={star > review.rating}
										>
											<path
												stroke-linecap="round"
												stroke-linejoin="round"
												stroke-width="2"
												d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
											/>
										</svg>
									{/each}
								</div>
								<span class="text-sm text-gray-500">
									{formatDateTime(review.createAt)}
								</span>
							</div>
						</div>
						
						<!-- Действия -->
						<div class="flex space-x-2">
							{#if $authStore.isAuthenticated && ($authStore.user?.id === review.userId || $hasRole(['moderator', 'admin']))}
								<button
									onclick={() => handleDeleteReview(review.id)}
									class="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded transition-colors"
									aria-label="Удалить отзыв"
								>
									<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="2"
											d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
										/>
									</svg>
								</button>
							{/if}
							{#if $hasRole(['moderator', 'admin'])}
								<button
									onclick={() => handleModerateReview(review.id, !review.isVisible)}
									class="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded transition-colors"
									aria-label={review.isVisible ? 'Скрыть отзыв' : 'Показать отзыв'}
									title={review.isVisible ? 'Скрыть отзыв' : 'Показать отзыв'}
								>
									{#if review.isVisible}
										<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path
												stroke-linecap="round"
												stroke-linejoin="round"
												stroke-width="2"
												d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
											/>
										</svg>
									{:else}
										<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path
												stroke-linecap="round"
												stroke-linejoin="round"
												stroke-width="2"
												d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
											/>
											<path
												stroke-linecap="round"
												stroke-linejoin="round"
												stroke-width="2"
												d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
											/>
										</svg>
									{/if}
								</button>
							{/if}
						</div>
					</div>

					{#if review.text}
						<p class="text-gray-700 whitespace-pre-line">{review.text}</p>
					{/if}
				</div>
			{/each}
		</div>
	{/if}
</div>
