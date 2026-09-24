// Диалог подтверждения вместо нативного confirm(): confirmDialog({...}) возвращает Promise<boolean>

import { writable } from 'svelte/store';

export interface ConfirmOptions {
	title: string;
	message?: string;
	confirmLabel?: string;
	cancelLabel?: string;
	/** Опасное действие: красная кнопка подтверждения */
	danger?: boolean;
}

export interface ConfirmRequest extends ConfirmOptions {
	resolve: (value: boolean) => void;
}

export const confirmRequest = writable<ConfirmRequest | null>(null);

export function confirmDialog(options: ConfirmOptions): Promise<boolean> {
	return new Promise((resolve) => {
		confirmRequest.update((previous) => {
			// Новый запрос вытесняет незакрытый старый: старый считается отменённым
			previous?.resolve(false);
			return { ...options, resolve };
		});
	});
}

export function resolveConfirm(value: boolean) {
	confirmRequest.update((request) => {
		request?.resolve(value);
		return null;
	});
}
