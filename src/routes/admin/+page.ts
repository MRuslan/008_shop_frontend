// У админки нет своей главной: сразу открываем товары, без промежуточного экрана «Загрузка…».
// Права проверяет layout админки и при необходимости уводит на главную магазина

import { redirect } from '@sveltejs/kit';

export function load() {
	redirect(307, '/admin/products');
}
