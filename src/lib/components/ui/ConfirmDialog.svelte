<script lang="ts">
	import { confirmRequest, resolveConfirm } from '$lib/stores/confirm';

	let dialog: HTMLDialogElement | undefined = $state();

	$effect(() => {
		if (!dialog) return;
		if ($confirmRequest) {
			if (!dialog.open) dialog.showModal();
		} else if (dialog.open) {
			dialog.close();
		}
	});

	// Escape и закрытие извне считаем отменой
	function handleClose() {
		if ($confirmRequest) resolveConfirm(false);
	}

	function handleBackdropClick(event: MouseEvent) {
		if (event.target === dialog) resolveConfirm(false);
	}

	// Escape отменяет и там, где браузер не шлёт нативный cancel
	function handleDialogKeydown(event: KeyboardEvent) {
		if (event.key === 'Escape') {
			event.preventDefault();
			resolveConfirm(false);
		}
	}
</script>

<dialog
	bind:this={dialog}
	onclose={handleClose}
	onclick={handleBackdropClick}
	onkeydown={handleDialogKeydown}
	aria-labelledby="confirm-dialog-title"
	aria-describedby={$confirmRequest?.message ? 'confirm-dialog-message' : undefined}
	class="m-auto w-[calc(100%-2rem)] max-w-md rounded-2xl bg-surface p-0 text-gray-900 shadow-[0_8px_24px_rgb(0_0_0/0.18)] backdrop:bg-black/40"
>
	{#if $confirmRequest}
		<div class="p-5 md:p-6">
			<h2 id="confirm-dialog-title" class="text-title text-ink">
				{$confirmRequest.title}
			</h2>
			{#if $confirmRequest.message}
				<p id="confirm-dialog-message" class="mt-2 text-body-sm text-gray-600">
					{$confirmRequest.message}
				</p>
			{/if}

			<div class="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
				<button
					type="button"
					onclick={() => resolveConfirm(false)}
					class="btn-secondary"
				>
					{$confirmRequest.cancelLabel ?? 'Отмена'}
				</button>
				<button
					type="button"
					onclick={() => resolveConfirm(true)}
					class={$confirmRequest.danger ? 'btn-danger' : 'btn-primary'}
				>
					{$confirmRequest.confirmLabel ?? 'Подтвердить'}
				</button>
			</div>
		</div>
	{/if}
</dialog>
