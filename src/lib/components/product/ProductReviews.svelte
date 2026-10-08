<script lang="ts">
	import { onMount } from 'svelte';
	import { reviewsApi } from '$lib/api/reviews';
	import { authStore, hasRole } from '$lib/stores/auth';
	import type { Review } from '$lib/types/common';
	import { formatDateTime } from '$lib/utils/format';
	import ReviewForm from './ReviewForm.svelte';
	import { getErrorMessage } from '$lib/utils/errors';
	import { confirmDialog } from '$lib/stores/confirm';
	import Star from '@lucide/svelte/icons/star';
	import PenLine from '@lucide/svelte/icons/pen-line';
	import Trash2 from '@lucide/svelte/icons/trash-2';
	import Eye from '@lucide/svelte/icons/eye';
	import EyeOff from '@lucide/svelte/icons/eye-off';

	interface Props {
		productId: number;
		/** Отзывы, уже загруженные на сервере: без них компонент загрузит список сам */
		initialReviews?: Review[] | null;
	}

	let { productId, initialReviews = null }: Props = $props();

	// Серверные отзывы попадают в HTML сразу: ни второго запроса после гидрации, ни мигания загрузки
	// svelte-ignore state_referenced_locally
	let reviews = $state<Review[]>(initialReviews ?? []);
	// svelte-ignore state_referenced_locally
	let isLoading = $state(initialReviews === null);
	let error = $state<string | null>(null);
	let showReviewForm = $state(false);

	onMount(async () => {
		if (initialReviews === null) await loadReviews();
	});

	async function loadReviews() {
		isLoading = true;
		error = null;

		try {
			const allReviews = await reviewsApi.getReviewsByProduct(productId);
			// Показываем только видимые отзывы
			reviews = allReviews.filter((review) => review.isVisible);
		} catch (err) {
			error = getErrorMessage(err, 'Не удалось загрузить отзывы.');
		} finally {
			isLoading = false;
		}
	}

	async function handleDeleteReview(reviewId: number) {
		const confirmed = await confirmDialog({
			title: 'Удалить отзыв?',
			message: 'Отзыв исчезнет со страницы товара. Это действие нельзя отменить.',
			confirmLabel: 'Удалить',
			danger: true
		});
		if (!confirmed) return;

		try {
			await reviewsApi.deleteReview(reviewId);
			await loadReviews();
		} catch (err) {
			error = getErrorMessage(err, 'Ошибка удаления отзыва');
		}
	}

	async function handleModerateReview(reviewId: number, isVisible: boolean) {
		try {
			await reviewsApi.moderateReview(reviewId, isVisible);
			await loadReviews();
		} catch (err) {
			error = getErrorMessage(err, 'Ошибка модерации отзыва');
		}
	}

</script>

<div>
	<div class="flex flex-wrap items-center justify-between gap-3">
		<h2 class="text-title text-ink">
			Отзывы
			{#if reviews.length > 0}
				<span class="font-normal text-gray-500 tabular-nums">{reviews.length}</span>
			{/if}
		</h2>
		{#if !showReviewForm}
			<button
				type="button"
				onclick={() => ($authStore.isAuthenticated ? (showReviewForm = true) : window.dispatchEvent(new CustomEvent('open-auth-modal', { detail: { reason: 'Войдите, чтобы написать отзыв о товаре.' } })))}
				class="btn-secondary"
			>
				<PenLine class="size-4" aria-hidden="true" />
				Написать отзыв
			</button>
		{/if}
	</div>

	{#if showReviewForm}
		<div class="mt-4">
			<ReviewForm
				{productId}
				onReviewAdded={() => {
					showReviewForm = false;
					loadReviews();
				}}
			/>
		</div>
	{/if}

	{#if isLoading}
		<p class="mt-4 text-body-sm text-gray-600" role="status">Загружаем отзывы…</p>
	{:else if error}
		<p role="alert" class="mt-4 notice-error">{error}</p>
	{:else if reviews.length === 0}
		<p class="mt-4 max-w-[36rem] text-body-sm text-gray-600">Отзывов пока нет. Купили этот товар? Расскажите, как он вам.</p>
	{:else}
		<ul class="mt-2 divide-y divide-line">
			{#each reviews as review (review.id)}
				<li class="py-4">
					<div class="flex items-start justify-between gap-3">
						<div class="min-w-0">
							<p class="font-medium text-ink">{review.user?.username || 'Покупатель'}</p>
							<div class="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
								<span class="flex items-center gap-0.5" role="img" aria-label="Оценка {review.rating} из 5">
									{#each Array.from({ length: 5 }, (_, i) => i + 1) as star (star)}
										<Star
											class="size-4 {star <= review.rating ? 'text-ink' : 'text-gray-300'}"
											fill={star <= review.rating ? 'currentColor' : 'none'}
											aria-hidden="true"
										/>
									{/each}
								</span>
								<time datetime={review.createAt} class="text-body-sm text-gray-500">{formatDateTime(review.createAt)}</time>
							</div>
						</div>

						<div class="flex shrink-0 gap-1">
							{#if $authStore.isAuthenticated && ($authStore.user?.id === review.userId || $hasRole(['moderator', 'admin']))}
								<button
									type="button"
									onclick={() => handleDeleteReview(review.id)}
									class="inline-flex size-11 items-center justify-center rounded-xl text-gray-500 transition-colors hover:bg-negative/8 hover:text-negative"
									aria-label="Удалить отзыв"
								>
									<Trash2 class="size-4.5" aria-hidden="true" />
								</button>
							{/if}
							{#if $hasRole(['moderator', 'admin'])}
								<button
									type="button"
									onclick={() => handleModerateReview(review.id, !review.isVisible)}
									class="inline-flex size-11 items-center justify-center rounded-xl text-gray-500 transition-colors hover:bg-gray-100 hover:text-ink"
									aria-label={review.isVisible ? 'Скрыть отзыв' : 'Показать отзыв'}
									title={review.isVisible ? 'Скрыть отзыв' : 'Показать отзыв'}
								>
									{#if review.isVisible}
										<EyeOff class="size-4.5" aria-hidden="true" />
									{:else}
										<Eye class="size-4.5" aria-hidden="true" />
									{/if}
								</button>
							{/if}
						</div>
					</div>

					{#if review.text}
						<p class="mt-2 max-w-[36rem] text-body text-pretty whitespace-pre-line text-gray-700">{review.text}</p>
					{/if}
				</li>
			{/each}
		</ul>
	{/if}
</div>
