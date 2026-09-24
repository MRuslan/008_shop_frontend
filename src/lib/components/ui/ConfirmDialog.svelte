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
	class="m-auto w-[calc(100%-2rem)] max-w-md rounded-lg bg-white p-0 text-gray-900 shadow-xl backdrop:bg-black/50"
>
	{#if $confirmRequest}
		<div class="p-6">
			<h2 id="confirm-dialog-title" class="text-lg font-semibold text-gray-900">
				{$confirmRequest.title}
			</h2>
			{#if $confirmRequest.message}
				<p id="confirm-dialog-message" class="mt-2 text-sm text-gray-600">
					{$confirmRequest.message}
				</p>
			{/if}

			<div class="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
				<button
					type="button"
					onclick={() => resolveConfirm(false)}
					class="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:outline-none"
				>
					{$confirmRequest.cancelLabel ?? 'Отмена'}
				</button>
				<button
					type="button"
					onclick={() => resolveConfirm(true)}
					class="rounded-md px-4 py-2 text-sm font-medium text-white transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none {$confirmRequest.danger
						? 'bg-red-600 hover:bg-red-700 focus-visible:ring-red-500'
						: 'bg-blue-600 hover:bg-blue-700 focus-visible:ring-blue-500'}"
				>
					{$confirmRequest.confirmLabel ?? 'Подтвердить'}
				</button>
			</div>
		</div>
	{/if}
</dialog>
