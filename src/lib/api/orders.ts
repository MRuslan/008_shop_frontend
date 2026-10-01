// API методы для заказов

import { apiClient } from './client';
import type { PaginatedResponse } from '$lib/types/api';
import type {
	Order,
	OrderStatus,
	CreateOrderDto,
	UpdateOrderStatusDto,
	OrderQuote,
	OrderQuoteDto
} from '$lib/types/order';

export interface OrdersQuery {
	status?: OrderStatus | string;
	dateFrom?: string;
	dateTo?: string;
	page?: number;
	limit?: number;
}

function toQuery(filters: OrdersQuery = {}, extra: Record<string, string> = {}): string {
	const params = new URLSearchParams(extra);
	if (filters.status) params.append('status', filters.status);
	if (filters.dateFrom) params.append('dateFrom', filters.dateFrom);
	if (filters.dateTo) params.append('dateTo', filters.dateTo);
	if (filters.page && filters.page > 1) params.append('page', String(filters.page));
	if (filters.limit) params.append('limit', String(filters.limit));
	const query = params.toString();
	return query ? `?${query}` : '';
}

export const ordersApi = {
	/**
	 * Создать заказ из корзины
	 */
	async createOrder(data: CreateOrderDto): Promise<Order> {
		return apiClient.post<Order>('/orders', data);
	},

	/**
	 * Предрасчёт по текущей корзине теми же правилами, что и оформление: промокод, доставка, итог.
	 * Ничего не создаёт и не резервирует
	 */
	async quote(data: OrderQuoteDto): Promise<OrderQuote> {
		return apiClient.post<OrderQuote>('/orders/quote', data);
	},

	/**
	 * Свои заказы, новые первыми, постранично
	 */
	async getMyOrders(filters?: OrdersQuery): Promise<PaginatedResponse<Order>> {
		return apiClient.get<PaginatedResponse<Order>>(`/orders${toQuery(filters)}`);
	},

	/**
	 * Получить заказ по ID
	 */
	async getOrderById(id: number): Promise<Order> {
		return apiClient.get<Order>(`/orders/${id}`);
	},

	/**
	 * Отменить свой заказ: можно, пока он не передан в доставку (pending, confirmed)
	 */
	async cancelOrder(id: number, comment?: string): Promise<Order> {
		return apiClient.post<Order>(`/orders/${id}/cancel`, comment ? { comment } : {});
	},

	/**
	 * Все заказы магазина (для admin/manager), постранично
	 */
	async getAllOrders(filters?: OrdersQuery): Promise<PaginatedResponse<Order>> {
		return apiClient.get<PaginatedResponse<Order>>(`/orders${toQuery(filters, { scope: 'all' })}`);
	},

	/**
	 * Изменить статус заказа (для admin/manager)
	 */
	async updateOrderStatus(id: number, data: UpdateOrderStatusDto): Promise<Order> {
		return apiClient.patch<Order>(`/orders/${id}/status`, data);
	}
};
