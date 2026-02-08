// API методы для купонов

import { apiClient } from './client';
import type { Coupon } from '$lib/types/common';

export interface CreateCouponDto {
	code: string;
	type: 'percent' | 'fixed';
	value: number;
	validFrom?: string;
	validTo?: string;
	isActive?: boolean;
}

export interface UpdateCouponDto {
	code?: string;
	type?: 'percent' | 'fixed';
	value?: number;
	validFrom?: string;
	validTo?: string;
	isActive?: boolean;
}

export const couponsApi = {
	/**
	 * Получить список купонов (для manager/admin)
	 */
	async getCoupons(): Promise<Coupon[]> {
		return apiClient.get<Coupon[]>('/coupons');
	},

	/**
	 * Получить купон по ID (для manager/admin)
	 */
	async getCouponById(id: number): Promise<Coupon> {
		return apiClient.get<Coupon>(`/coupons/${id}`);
	},

	/**
	 * Создать купон (для manager/admin)
	 */
	async createCoupon(data: CreateCouponDto): Promise<Coupon> {
		return apiClient.post<Coupon>('/coupons', data);
	},

	/**
	 * Обновить купон (для manager/admin)
	 */
	async updateCoupon(id: number, data: UpdateCouponDto): Promise<Coupon> {
		return apiClient.patch<Coupon>(`/coupons/${id}`, data);
	},

	/**
	 * Удалить купон (для manager/admin)
	 */
	async deleteCoupon(id: number): Promise<void> {
		return apiClient.delete<void>(`/coupons/${id}`);
	}
};
