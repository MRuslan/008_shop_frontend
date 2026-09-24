// Уведомления (тосты) вместо нативного alert()

import { writable } from 'svelte/store';

export type ToastType = 'success' | 'error' | 'info';

export interface ToastAction {
	label: string;
	href: string;
}

export interface Toast {
	id: number;
	type: ToastType;
	message: string;
	action?: ToastAction;
}

interface ToastOptions {
	action?: ToastAction;
	/** мс; по умолчанию зависит от типа */
	duration?: number;
}

const DEFAULT_DURATION: Record<ToastType, number> = {
	success: 4000,
	info: 5000,
	error: 8000
};

const MAX_VISIBLE = 4;

let nextId = 1;
const timers = new Map<number, ReturnType<typeof setTimeout>>();
const { subscribe, update } = writable<Toast[]>([]);

function dismiss(id: number) {
	const timer = timers.get(id);
	if (timer) {
		clearTimeout(timer);
		timers.delete(id);
	}
	update((list) => list.filter((t) => t.id !== id));
}

function push(type: ToastType, message: string, options: ToastOptions = {}): number {
	const id = nextId++;
	update((list) => [...list, { id, type, message, action: options.action }].slice(-MAX_VISIBLE));

	if (typeof window !== 'undefined') {
		const duration = options.duration ?? DEFAULT_DURATION[type];
		timers.set(
			id,
			setTimeout(() => dismiss(id), duration)
		);
	}

	return id;
}

export const toasts = { subscribe, dismiss };

export const toast = {
	success: (message: string, options?: ToastOptions) => push('success', message, options),
	error: (message: string, options?: ToastOptions) => push('error', message, options),
	info: (message: string, options?: ToastOptions) => push('info', message, options)
};
