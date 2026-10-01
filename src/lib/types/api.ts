// Базовые типы для API ответов

/** Ошибка валидации одного поля: `field` — путь (`email`, `settings.delivery.price`, `attributes.0.name`) */
export interface FieldError {
	field: string;
	constraint: string;
	message: string;
}

export interface ApiError {
	statusCode: number;
	message: string | string[];
	error?: string;
	/** Есть у 400 от валидации тела и query */
	errors?: FieldError[];
}

export interface PaginatedResponse<T> {
	data: T[];
	total: number;
	page: number;
	limit: number;
}
