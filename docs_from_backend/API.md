# API интернет-магазина — полная документация для фронтенда

Документ описывает все эндпоинты бэкенда. На его основе можно реализовать фронтенд (веб или мобильное приложение).

---

## 1. Базовые сведения

### 1.1 Base URL

- Все запросы к API идут на **одну точку входа** с префиксом **`/api`**.
- Пример: `http://localhost:3000/api` (порт по умолчанию 3000, задаётся через `PORT`).
- Для фронта рекомендуется вынести base URL в конфиг (например `VITE_API_URL` / `NEXT_PUBLIC_API_URL`).

### 1.2 CORS

- CORS включён для всех источников (`app.enableCors()`). В продакшене можно ограничить `origin`.

### 1.3 Content-Type

- Запросы с телом: **`Content-Type: application/json`**.
- Ответы: **JSON** (кроме бинарных данных, если появятся в будущем).

### 1.4 Формат ошибок

При 4xx/5xx ответ приходит в JSON. Типичная структура (NestJS):

```json
{
  "statusCode": 400,
  "message": "Текст ошибки или массив строк валидации",
  "error": "Bad Request"
}
```

- **400 Bad Request** — невалидные данные (в т.ч. DTO), бизнес-ошибка (пустая корзина, нет товара и т.п.).
- **401 Unauthorized** — нет токена или токен невалиден/истёк.
- **403 Forbidden** — недостаточно прав (роль, чужие данные).
- **404 Not Found** — ресурс не найден.
- **409 Conflict** — конфликт (дубликат slug, email, отзыва и т.д.).

Для фронта: показывать `message` пользователю; по `statusCode` решать повтор логина (401) или редирект.

### 1.5 Аутентификация

- **JWT (access_token):** для защищённых эндпоинтов в заголовок добавляется:
  - **`Authorization: Bearer <access_token>`**
- Токен возвращается в **login** и **register** в поле **`access_token`**; обновление пары — через **refresh** (см. раздел Auth).
- **Корзина** допускает два варианта идентификации (без токена корзина недоступна):
  - Либо **`Authorization: Bearer <access_token>`** (корзина пользователя),
  - Либо заголовок **`X-Session-Id`** (гостевая корзина; произвольная строка, например UUID).
- Остальные эндпоинты либо публичные, либо только JWT (в описании указано).

### 1.6 Роли (для отображения и ограничений на фронте)

| Значение   | Описание |
|------------|----------|
| `customer` | Покупатель (роль по умолчанию при регистрации). |
| `moderator`| Модерация отзывов. |
| `support`  | Поддержка. |
| `manager`  | Товары, заказы, купоны, точки продаж. |
| `admin`    | Полный доступ, в т.ч. настройки магазина и роли. |

Роль приходит в **register/login** в объекте **`user.role`** и в **GET /api/auth/me**.

---

## 2. Справочники (enum), нужные фронту

### 2.1 Статус заказа (Order status)

- `pending` — ожидает подтверждения  
- `confirmed` — подтверждён  
- `shipped` — передан в доставку  
- `delivered` — доставлен  
- `cancelled` — отменён  

### 2.2 Тип доставки (Delivery type)

- `delivery` — доставка по адресу  
- `pickup` — самовывоз  

### 2.3 Тип точки продаж (Location type)

- `warehouse` — склад  
- `pickup_point` — пункт выдачи  
- `retail` — розничный магазин  

### 2.4 Тип купона (Coupon type)

- `percent` — скидка в процентах  
- `fixed` — фиксированная сумма скидки  

---

## 3. Эндпоинты по разделам

### 3.1 Общие и здоровье

| Метод | Путь | Описание | Auth |
|-------|------|----------|------|
| GET | `/api/` | Проверка работы сервера | — |
| GET | `/api/health` | Health check | — |

---

### 3.2 Auth — `/api/auth`

| Метод | Путь | Описание | Auth |
|-------|------|----------|------|
| POST | `/api/auth/register` | Регистрация | — |
| POST | `/api/auth/login` | Вход | — |
| POST | `/api/auth/refresh` | Обновление пары токенов | — |
| GET | `/api/auth/me` | Текущий пользователь | JWT |
| POST | `/api/auth/logout` | Выход | JWT |
| DELETE | `/api/auth/account` | Удаление аккаунта | JWT |
| PATCH | `/api/auth/users/:id/role` | Смена роли пользователя | JWT, ADMIN |

**Register (POST /api/auth/register)**  
Body: `{ "email": string, "password": string, "username": string }`  
Response: `{ user: { id, email, username, role }, access_token, refresh_token }`

**Login (POST /api/auth/login)**  
Body: `{ "email": string, "password": string }`  
Response: `{ user: { id, email, username, role }, access_token, refresh_token }`

**Refresh (POST /api/auth/refresh)**  
Body: `{ "refresh_token": string }`  
Response: `{ access_token, refresh_token }`

**Me (GET /api/auth/me)**  
Response: `{ id, email, username, role }`

**Logout (POST /api/auth/logout)**  
Response: `{ message: string }`

**Delete account (DELETE /api/auth/account)**  
Body: `{ "password": string }`  
Response: `{ message: string }`

**Update user role (PATCH /api/auth/users/:id/role)**  
Body: `{ "role": "manager" | "admin" | "moderator" | "support" | "customer" }`  
Response: `{ id, email, username, role }`

---

### 3.3 Категории — `/api/categories`

| Метод | Путь | Описание | Auth |
|-------|------|----------|------|
| GET | `/api/categories` | Список (плоский или дерево) | — |
| GET | `/api/categories/slug/:slug` | По slug | — |
| GET | `/api/categories/:id` | По id | — |
| POST | `/api/categories` | Создать | JWT, MANAGER/ADMIN |
| PATCH | `/api/categories/:id` | Обновить | JWT, MANAGER/ADMIN |
| DELETE | `/api/categories/:id` | Удалить | JWT, MANAGER/ADMIN |

**GET /api/categories**  
Query: `tree` (boolean), `isActive` (boolean), `sortBy` (name | sortOrder | createAt), `sortOrder` (ASC | DESC)  
Response: массив категорий. При `tree=true` у элементов есть вложенный массив `children`.

Категория: `{ id, name, slug, parentId, sortOrder, isActive, createAt, updateAt, parent?, children? }`

**POST /api/categories**  
Body: `{ name, slug?, parentId?, sortOrder?, isActive? }`  
Response: объект категории.

---

### 3.4 Товары — `/api/products`

| Метод | Путь | Описание | Auth |
|-------|------|----------|------|
| GET | `/api/products` | Список с поиском и фильтрами | — |
| GET | `/api/products/slug/:slug` | По slug | — |
| GET | `/api/products/:id` | По id | — |
| POST | `/api/products` | Создать | JWT, MANAGER/ADMIN |
| PATCH | `/api/products/:id` | Обновить | JWT, MANAGER/ADMIN |
| DELETE | `/api/products/:id` | Удалить | JWT, MANAGER/ADMIN |

**GET /api/products**  
Query: `search`, `categoryId`, `minPrice`, `maxPrice`, `inStock` (boolean), `isActive`, `sortBy` (price | createAt | name), `sortOrder`, `page`, `limit`  
Response: `{ data: Product[], total: number, page: number, limit: number }`

Товар: `{ id, name, slug, description, price, compareAtPrice, sku, quantity, categoryId, isActive, createAt, updateAt, category?, images? }`. Поле `price` в ответе — строка (decimal).

**POST /api/products**  
Body: `{ name, slug?, description?, price, compareAtPrice?, sku?, quantity?, categoryId?, images?: [{ url, sortOrder? }], isActive? }`  
Response: объект товара с `category` и `images`.

---

### 3.5 Корзина — `/api/cart`

Идентификация: **JWT** или **X-Session-Id** (обязательно один из двух).

| Метод | Путь | Описание | Auth |
|-------|------|----------|------|
| GET | `/api/cart` | Получить/создать корзину | JWT или X-Session-Id |
| POST | `/api/cart/items` | Добавить товар | JWT или X-Session-Id |
| PATCH | `/api/cart/items/:id` | Изменить количество | JWT или X-Session-Id |
| DELETE | `/api/cart/items/:id` | Удалить позицию | JWT или X-Session-Id |
| DELETE | `/api/cart` | Очистить корзину | JWT или X-Session-Id |
| POST | `/api/cart/merge-session` | Слияние гостевой корзины в пользовательскую | JWT |

**GET /api/cart**  
Response: `{ id, userId?, sessionId?, createAt, updateAt, items: [{ id, cartId, productId, quantity, product }] }`

**POST /api/cart/items**  
Body: `{ "productId": number, "quantity": number }`  
Response: корзина с обновлённым `items`.

**PATCH /api/cart/items/:id**  
Body: `{ "quantity": number }` (0 — удалить позицию)  
Response: корзина.

**POST /api/cart/merge-session**  
Body: `{ "sessionId": string }`  
Response: корзина пользователя после слияния.

---

### 3.6 Адреса доставки — `/api/addresses`

Все методы требуют **JWT**. Работа только с адресами текущего пользователя.

| Метод | Путь | Описание | Auth |
|-------|------|----------|------|
| GET | `/api/addresses` | Список адресов | JWT |
| GET | `/api/addresses/:id` | Один адрес | JWT |
| POST | `/api/addresses` | Добавить | JWT |
| PATCH | `/api/addresses/:id/default` | Сделать адрес по умолчанию | JWT |
| PATCH | `/api/addresses/:id` | Обновить | JWT |
| DELETE | `/api/addresses/:id` | Удалить | JWT |

**POST /api/addresses**  
Body: `{ label, city, street, building, apartment?, postalCode?, phone, isDefault? }`  
Response: объект адреса.

Адрес: `{ id, userId, label, city, street, building, apartment, postalCode, phone, isDefault, createAt, updateAt }`.

---

### 3.7 Заказы — `/api/orders`

Все методы требуют **JWT**. Список всех заказов и смена статуса — только MANAGER/ADMIN.

| Метод | Путь | Описание | Auth |
|-------|------|----------|------|
| POST | `/api/orders` | Создать заказ из корзины | JWT |
| GET | `/api/orders` | Свои заказы или все (при scope=all) | JWT |
| GET | `/api/orders/:id` | Один заказ | JWT (свой или админ) |
| PATCH | `/api/orders/:id/status` | Сменить статус | JWT, MANAGER/ADMIN |

**POST /api/orders**  
Body: `{ deliveryType: "delivery"|"pickup", deliveryAddressId? (обяз. при delivery), pickupLocationId?, couponCode?, comment? }`  
Response: заказ с `items`. При доставке обязателен `deliveryAddressId`. При самовывозе можно передать `pickupLocationId` (id из `/api/locations`). Опционально `couponCode` — применяется скидка, в заказе возвращаются `couponCode`, `discountAmount`, пересчитанный `totalAmount`.

Заказ: `{ id, userId, status, deliveryType, pickupLocation?, deliveryAddressId?, deliveryAddressSnapshot?, paymentMethod, totalAmount, couponCode?, discountAmount?, comment?, items: [{ id, productId, productName, price, quantity }], createAt, updateAt }`.

**GET /api/orders?scope=all&status=...&dateFrom=...&dateTo=...**  
Для админа/менеджера: query `scope=all`, опционально `status`, `dateFrom`, `dateTo` (ISO даты).  
Response: массив заказов.

**PATCH /api/orders/:id/status**  
Body: `{ "status": "pending"|"confirmed"|"shipped"|"delivered"|"cancelled" }`  
Response: обновлённый заказ.

---

### 3.8 Магазин (настройки) — `/api/store`

| Метод | Путь | Описание | Auth |
|-------|------|----------|------|
| GET | `/api/store` | Настройки текущего магазина | — |
| POST | `/api/store` | Создать магазин | JWT, ADMIN |
| PATCH | `/api/store` | Обновить текущий | JWT, ADMIN |
| PATCH | `/api/store/:id` | Обновить по id | JWT, ADMIN |

**GET /api/store**  
Response: `{ id, name, slug, logoUrl, faviconUrl, contactEmail, contactPhone, legalName, inn, legalAddress, currency, timezone, locale, isActive, settings, createAt, updateAt }`. Поле `settings` — произвольный JSON (способы доставки/оплаты и т.д.).

---

### 3.9 Точки продаж — `/api/locations`

| Метод | Путь | Описание | Auth |
|-------|------|----------|------|
| GET | `/api/locations` | Список точек | — |
| GET | `/api/locations/:id` | Одна точка | — |
| POST | `/api/locations` | Создать | JWT, MANAGER/ADMIN |
| PATCH | `/api/locations/:id` | Обновить | JWT, MANAGER/ADMIN |
| DELETE | `/api/locations/:id` | Удалить | JWT, MANAGER/ADMIN |

**GET /api/locations**  
Query: `storeId`, `isActive`  
Response: массив `{ id, storeId, name, type, city, street, building, apartment, postalCode, phone, openingHours, sortOrder, isActive, createAt, updateAt }`. Тип: `warehouse` | `pickup_point` | `retail`.

**POST /api/locations**  
Body: `{ name, type, city, street, building, apartment?, postalCode?, phone, openingHours?, sortOrder?, isActive?, storeId? }`  
Response: объект точки.

---

### 3.10 Отзывы — `/api/reviews`

| Метод | Путь | Описание | Auth |
|-------|------|----------|------|
| GET | `/api/reviews?productId=:id` | Отзывы по товару | — |
| POST | `/api/reviews` | Добавить отзыв | JWT |
| DELETE | `/api/reviews/:id` | Удалить отзыв | JWT (автор или MODERATOR/ADMIN) |
| PATCH | `/api/reviews/:id/moderate` | Скрыть/показать | JWT, MODERATOR/ADMIN |

**GET /api/reviews?productId=**  
Query: `productId` (обязателен).  
Response: массив отзывов с полем `user` (без пароля). Отзыв: `{ id, userId, productId, rating, text, moderatedBy, isVisible, createAt }`.

**POST /api/reviews**  
Body: `{ "productId": number, "rating": 1..5, "text"?: string }`  
Response: созданный отзыв.

**PATCH /api/reviews/:id/moderate**  
Body: `{ "isVisible": boolean }`  
Response: обновлённый отзыв.

---

### 3.11 Избранное — `/api/wishlist`

Все методы требуют **JWT**.

| Метод | Путь | Описание | Auth |
|-------|------|----------|------|
| GET | `/api/wishlist` | Список избранного | JWT |
| POST | `/api/wishlist` | Добавить товар | JWT |
| DELETE | `/api/wishlist/product/:productId` | Удалить по productId | JWT |
| DELETE | `/api/wishlist/:id` | Удалить по id позиции | JWT |

**POST /api/wishlist**  
Body: `{ "productId": number }`  
Response: объект позиции избранного с `product`.

---

### 3.12 Купоны — `/api/coupons`

Все методы требуют **JWT** и роль **MANAGER** или **ADMIN**.

| Метод | Путь | Описание | Auth |
|-------|------|----------|------|
| GET | `/api/coupons` | Список купонов | JWT, MANAGER/ADMIN |
| GET | `/api/coupons/:id` | Один купон | JWT, MANAGER/ADMIN |
| POST | `/api/coupons` | Создать | JWT, MANAGER/ADMIN |
| PATCH | `/api/coupons/:id` | Обновить | JWT, MANAGER/ADMIN |
| DELETE | `/api/coupons/:id` | Удалить | JWT, MANAGER/ADMIN |

**POST /api/coupons**  
Body: `{ code, type: "percent"|"fixed", value, validFrom?, validTo?, isActive? }`  
Response: объект купона. Код сохраняется в верхнем регистре.

Применение купона: в **POST /api/orders** передать в теле `couponCode`. Сервер проверит купон и пересчитает `totalAmount`, вернёт `discountAmount` и `couponCode` в заказе.

---

## 4. Рекомендуемый порядок запросов для фронта

1. **Старт:** `GET /api/store` — настройки магазина (название, валюта, контакты). При 404 — показать сообщение «Магазин не настроен».
2. **Каталог:** `GET /api/categories?tree=true`, `GET /api/products?page=1&limit=20` (и при необходимости фильтры).
3. **Корзина (гость):** генерировать и хранить `sessionId` (UUID), все запросы корзины с заголовком `X-Session-Id: <sessionId>`.
4. **Регистрация/логин:** `POST /api/auth/register` или `POST /api/auth/login` → сохранить `access_token` (и при необходимости `refresh_token`).
5. **После логина:** при наличии гостевой корзины вызвать `POST /api/cart/merge-session` с телом `{ sessionId }`, затем далее использовать только JWT для корзины.
6. **Профиль:** `GET /api/auth/me` — текущий пользователь и роль.
7. **Оформление заказа:** список адресов `GET /api/addresses`, список точек самовывоза `GET /api/locations`, создание заказа `POST /api/orders` с выбранным `deliveryType`, `deliveryAddressId` или `pickupLocationId`, опционально `couponCode`.
8. **Мои заказы:** `GET /api/orders` (без `scope=all`).
9. **Админ/менеджер:** заказы — `GET /api/orders?scope=all`, смена статуса — `PATCH /api/orders/:id/status`; категории, товары, купоны, точки — по таблицам выше.

---

## 5. Дополнительные документы

- **ROLES.md** — управление ролями и назначение первого администратора.
- **docs/API_AUTH.md**, **API_CATALOG.md**, **API_CART.md**, **API_ADDRESSES.md**, **API_ORDERS.md**, **API_STORE_AND_LOCATIONS.md**, **API_REVIEWS_WISHLIST_COUPONS.md** — детальные описания и примеры по разделам.
- **postman/Shop Backend.postman_collection.json** — коллекция Postman для проверки всех эндпоинтов.
