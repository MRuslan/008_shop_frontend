# Роли пользователей

## Список ролей

| Роль       | Значение   | Описание |
|-----------|------------|----------|
| **CUSTOMER**  | `customer`  | Покупатель — просмотр каталога, корзина, заказы. Роль по умолчанию при регистрации. |
| **MODERATOR** | `moderator` | Модератор — модерация отзывов, контента, жалоб. |
| **SUPPORT**   | `support`   | Поддержка — просмотр заказов, общение с клиентами. |
| **MANAGER**   | `manager`   | Менеджер — товары, заказы, склад, скидки. |
| **ADMIN**     | `admin`     | Администратор — полный доступ, управление ролями и настройками. |

## Как управлять ролями

### 1. Назначение роли при регистрации

При регистрации через `POST /auth/register` пользователю автоматически присваивается роль **CUSTOMER**. Менять роль при регистрации через API нельзя (только через БД или эндпоинт смены роли).

### 2. Смена роли пользователя (только ADMIN)

**Эндпоинт:** `PATCH /auth/users/:id/role`

**Доступ:** только пользователь с ролью `admin`.

**Тело запроса:**
```json
{
  "role": "manager"
}
```

**Пример (curl):**
```bash
curl -X PATCH http://localhost:3000/auth/users/5/role \
  -H "Authorization: Bearer <ACCESS_TOKEN_ADMIN>" \
  -H "Content-Type: application/json" \
  -d '{"role": "moderator"}'
```

**Ответ:** объект пользователя с обновлённой ролью (`id`, `email`, `username`, `role`).

### 3. Назначение первого администратора

Так как смена роли доступна только ADMIN, первого админа нужно создать вручную:

**Вариант A — через БД (рекомендуется):**
```sql
UPDATE users SET role = 'admin' WHERE email = 'admin@example.com';
```

**Вариант B — временно разрешить в коде:** в `AuthService.register()` можно один раз задать роль по email (например, для первого пользователя) и затем убрать эту логику.

### 4. Защита эндпоинтов по ролям

Чтобы ограничить доступ к методу контроллера по ролям:

1. Подключите guard и декоратор:
```ts
import { UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { Role } from '../common/enums/role.enum';
```

2. Повесьте на метод (сначала JWT, затем RolesGuard):
```ts
@Get('admin-only')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles(Role.ADMIN)
adminOnly() {
  return { message: 'Only admin' };
}
```

3. Допустить несколько ролей:
```ts
@Roles(Role.ADMIN, Role.MANAGER)
```

Порядок guards важен: сначала `AuthGuard('jwt')` (проверка токена и заполнение `req.user`), затем `RolesGuard` (проверка `req.user.role`).

### 5. Получение роли текущего пользователя

- В ответах **register** и **login** в объекте `user` есть поле `role`.
- Эндпоинт **GET /auth/me** (с JWT) возвращает `id`, `email`, `username`, `role`.
- В защищённых роутах роль доступна как `req.user.role`.

## Файлы

- **Enum ролей:** `src/common/enums/role.enum.ts`
- **Декоратор:** `src/common/decorators/roles.decorator.ts`
- **Guard:** `src/common/guards/roles.guard.ts`
- **Сущность:** поле `role` в `src/entities/user.entity.ts`
- **Миграция:** `src/migrations/1700000000003-AddRoleToUsers.ts`

После добавления миграции выполните:
```bash
npm run migration:run
```
