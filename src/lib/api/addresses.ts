// API методы для адресов доставки

import { apiClient, type LoadOptions } from './client';
import type { Address, CreateAddressDto, UpdateAddressDto } from '$lib/types/common';

export const addressesApi = {
	/**
	 * Получить список адресов пользователя
	 */
	async getAddresses(options: LoadOptions = {}): Promise<Address[]> {
		return apiClient.get<Address[]>('/addresses', options);
	},

	/**
	 * Получить адрес по ID
	 */
	async getAddressById(id: number): Promise<Address> {
		return apiClient.get<Address>(`/addresses/${id}`);
	},

	/**
	 * Создать адрес
	 */
	async createAddress(data: CreateAddressDto): Promise<Address> {
		return apiClient.post<Address>('/addresses', data);
	},

	/**
	 * Обновить адрес
	 */
	async updateAddress(id: number, data: UpdateAddressDto): Promise<Address> {
		return apiClient.patch<Address>(`/addresses/${id}`, data);
	},

	/**
	 * Установить адрес по умолчанию
	 */
	async setDefaultAddress(id: number): Promise<Address> {
		return apiClient.patch<Address>(`/addresses/${id}/default`, {});
	},

	/**
	 * Удалить адрес
	 */
	async deleteAddress(id: number): Promise<{ message: string }> {
		return apiClient.delete<{ message: string }>(`/addresses/${id}`);
	}
};
