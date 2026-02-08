// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
import type { Store } from '$lib/types/common';

declare global {
	namespace App {
		// interface Error {}
		// interface Locals {}
		interface PageData {
			store?: Store | null;
		}
		// interface PageState {}
		// interface Platform {}
	}
}

export {};
