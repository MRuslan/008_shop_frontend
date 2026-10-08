// Типы для авторизации

export type Role = 'customer' | 'moderator' | 'support' | 'manager' | 'admin';

export interface User {
	id: number;
	email: string;
	username: string;
	role: Role;
}

/** Ответ входа и регистрации: токены сервер витрины оставил в httpOnly-cookie */
export interface SignInResponse {
	user: User;
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
