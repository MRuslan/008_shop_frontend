# API: Отзывы, избранное, купоны (п. 6 плана)

Базовый префикс: **`/api`**.

---

## 6.1 Остатки

Уже реализовано: при создании заказа списывается `Product.quantity`, при смене статуса заказа на **cancelled** остатки по позициям возвращаются на склад.

---

## Отзывы (ProductReview)

Путь: **`/api/reviews`**.

### Список отзывов по товару

**`GET /api/reviews?productId=:id`** — публичный.

Возвращает только видимые отзывы (после модерации). Отзывы с полем `user` (без пароля).

### Добавить отзыв

**`POST /api/reviews`** — JWT.

**Тело:** `{ "productId": number, "rating": 1..5, "text"?: string }`.

Один пользователь — один отзыв на товар. 400 при повторной попытке.

### Удалить отзыв

**`DELETE /api/reviews/:id`** — JWT.

Удалить может автор отзыва или MODERATOR/ADMIN.

### Модерация (скрыть/показать)

**`PATCH /api/reviews/:id/moderate`** — только **MODERATOR**, **ADMIN**.

**Тело:** `{ "isVisible": boolean }`.

---

## Избранное (Wishlist)

Путь: **`/api/wishlist`**. Все эндпоинты требуют **JWT**.

### Список избранного

**`GET /api/wishlist`** — список позиций текущего пользователя с полем `product`.

### Добавить в избранное

**`POST /api/wishlist`** — тело: `{ "productId": number }`.

### Удалить по productId

**`DELETE /api/wishlist/product/:productId`**.

### Удалить по id позиции

**`DELETE /api/wishlist/:id`**.

---

## Купоны

Путь: **`/api/coupons`**. CRUD — только **MANAGER**, **ADMIN**.

### Список купонов

**`GET /api/coupons`** — JWT + роль.

### Один купон

**`GET /api/coupons/:id`** — JWT + роль.

### Создать купон

**`POST /api/coupons`**.

**Тело:** `{ "code": string, "type": "percent" | "fixed", "value": number, "validFrom"?: ISO date, "validTo"?: ISO date, "isActive"?: boolean }`.

- **percent** — скидка в процентах (value 0–100).
- **fixed** — фиксированная сумма скидки (не больше суммы заказа).

Код сохраняется в верхнем регистре.

### Обновить купон

**`PATCH /api/coupons/:id`** — частичное обновление полей.

### Удалить купон

**`DELETE /api/coupons/:id`**.

### Применение купона при заказе

В **POST /api/orders** в теле можно передать **`couponCode`** (строка). Сервер проверяет купон (активен, в периоде действия), считает скидку от суммы корзины и сохраняет в заказе `couponCode`, `discountAmount` и пересчитанный `totalAmount`.

---

## Миграции

```bash
npm run migration:run
```

Создаются таблицы: **product_reviews**, **wishlist_items**, **coupons**, а также добавляются колонки **coupon_code**, **discount_amount** в таблицу **orders**.
