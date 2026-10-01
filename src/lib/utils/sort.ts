// Сортировка списков товаров: разбор из адреса с проверкой, чтобы мусор в URL не уходил в API

export const SORT_FIELDS = ['createAt', 'price', 'name', 'rating'] as const;
export type SortField = (typeof SORT_FIELDS)[number];

export function parseSort(params: URLSearchParams): { sortBy: SortField; sortOrder: 'ASC' | 'DESC' } {
	const sortBy = params.get('sortBy');
	return {
		sortBy: SORT_FIELDS.includes(sortBy as SortField) ? (sortBy as SortField) : 'createAt',
		sortOrder: params.get('sortOrder') === 'ASC' ? 'ASC' : 'DESC'
	};
}
