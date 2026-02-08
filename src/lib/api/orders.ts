// API методы для заказов

import { apiClient } from './client';
import type { Order, CreateOrderDto, UpdateOrderStatusDto } from '$lib/types/order';

export const ordersApi = {
	/**
	 * Создать заказ из корзины
	 */
	async createOrder(data: CreateOrderDto): Promise<Order> {
		return apiClient.post<Order>('/orders', data);
	},

	/**
	 * Получить список своих заказов
	 */
	async getMyOrders(): Promise<Order[]> {
		return apiClient.get<Order[]>('/orders');
	},

	/**
	 * Получить заказ по ID
	 */
	async getOrderById(id: number): Promise<Order> {
		return apiClient.get<Order>(`/orders/${id}`);
	},

	/**
	 * Получить все заказы (для admin/manager)
	 */
	async getAllOrders(filters?: {
		status?: string;
		dateFrom?: string;
		dateTo?: string;
	}): Promise<Order[]> {
		const params = new URLSearchParams();
		params.append('scope', 'all');
		if (filters?.status) params.append('status', filters.status);
		if (filters?.dateFrom) params.append('dateFrom', filters.dateFrom);
		if (filters?.dateTo) params.append('dateTo', filters.dateTo);

		return apiClient.get<Order[]>(`/orders?${params.toString()}`);
	},

	/**
	 * Изменить статус заказа (для admin/manager)
	 */
	async updateOrderStatus(id: number, data: UpdateOrderStatusDto): Promise<Order> {
		return apiClient.patch<Order>(`/orders/${id}/status`, data);
	}
};
