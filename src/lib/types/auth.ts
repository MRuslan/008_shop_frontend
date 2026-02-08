// Типы для авторизации

export type Role = 'customer' | 'moderator' | 'support' | 'manager' | 'admin';

export interface User {
	id: number;
	email: string;
	username: string;
	role: Role;
}

export interface AuthResponse {
	user: User;
	access_token: string;
	refresh_token: string;
}

export interface RefreshTokenResponse {
	access_token: string;
	refresh_token: string;
}

export interface RegisterDto {
	email: string;
	password: string;
	username: string;
}

export interface LoginDto {
	email: string;
	password: string;
}

export interface RefreshTokenDto {
	refresh_token: string;
}

export interface DeleteAccountDto {
	password: string;
}

export interface UpdateRoleDto {
	role: Role;
}
