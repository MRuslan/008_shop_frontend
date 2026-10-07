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

/** Заявка на смену email: ждёт перехода по ссылке из письма на новый адрес */
export interface PendingEmailChange {
	pendingEmail: string | null;
	expiresAt: string | null;
}
