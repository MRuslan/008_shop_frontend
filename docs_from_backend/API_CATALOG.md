# API: Каталог (категории и товары)

Базовый префикс: **`/api`**. Все эндпоинты ниже указаны относительно него.

Аутентификация: заголовок `Authorization: Bearer <access_token>` (JWT). Эндпоинты, помеченные как **публичные**, не требуют токена.

---

## Категории

Базовый путь: **`/api/categories`**.

### Список категорий (плоский или дерево)

**`GET /api/categories`** — публичный.

Возвращает список категорий: либо плоский список, либо дерево с вложенными `children`.

**Query-параметры:**

| Параметр   | Тип    | По умолчанию | Описание |
|-----------|--------|--------------|----------|
| `tree`    | boolean | —          | Если `true`, ответ — массив корневых категорий с вложенным массивом `children` у каждой. |
| `isActive`| boolean | `true`     | Только активные категории. |
| `sortBy`  | string | `sortOrder` | Поле сортировки: `name`, `sortOrder`, `createAt`. |
| `sortOrder` | string | `ASC`   | Направление: `ASC` или `DESC`. |

**Примеры:**

- Плоский список: `GET /api/categories`
- Дерево: `GET /api/categories?tree=true`
- Сортировка по имени: `GET /api/categories?sortBy=name&sortOrder=ASC`

**Ответ:** массив объектов категории (id, name, slug, parentId, sortOrder, isActive, createAt, updateAt; при `tree=true` у элементов есть массив `children`).

---

### Одна категория по id

**`GET /api/categories/:id`** — публичный.

**Ответ:** объект категории с полями `parent` и `children` (связанные категории).

---

### Одна категория по slug

**`GET /api/categories/slug/:slug`** — публичный.

Пример: `GET /api/categories/slug/elektronika`.

**Ответ:** объект категории с `parent` и `children`.

---

### Создать категорию

**`POST /api/categories`** — требуется JWT и роль **MANAGER** или **ADMIN**.

**Тело запроса (JSON):**

| Поле      | Тип    | Обязательное | Описание |
|-----------|--------|--------------|----------|
| `name`    | string | да           | Название. |
| `slug`    | string | нет          | URL-slug. Если не передан, генерируется из `name`. |
| `parentId`| number \| null | нет  | Id родительской категории; `null` — корневая. |
| `sortOrder` | number | нет        | Порядок сортировки (по умолчанию 0). |
| `isActive` | boolean | нет        | Активна ли категория (по умолчанию true). |

**Ответ:** созданный объект категории.

---

### Обновить категорию

**`PATCH /api/categories/:id`** — JWT, роль **MANAGER** или **ADMIN**.

**Тело запроса (JSON):** все поля опциональны (частичное обновление).

- `name`, `slug`, `parentId`, `sortOrder`, `isActive` — аналогично созданию.

**Ответ:** обновлённый объект категории.

---

### Удалить категорию

**`DELETE /api/categories/:id`** — JWT, роль **MANAGER** или **ADMIN**.

**Ответ:** статус 200 без тела. У дочерних категорий `parentId` станет `null` (SET NULL).

---

## Товары

Базовый путь: **`/api/products`**.

### Список товаров (с поиском и фильтрами)

**`GET /api/products`** — публичный.

Возвращает пагинированный список товаров с поддержкой поиска, фильтров и сортировки.

**Query-параметры:**

| Параметр   | Тип    | По умолчанию | Описание |
|-----------|--------|--------------|----------|
| `search`  | string | —            | Поиск по названию и описанию (LIKE). |
| `categoryId` | number | —          | Фильтр по id категории. |
| `minPrice`| number | —            | Минимальная цена. |
| `maxPrice`| number | —            | Максимальная цена. |
| `inStock` | boolean | —           | Если `true`, только товары с `quantity > 0`. |
| `isActive`| boolean | `true`     | Только активные товары. |
| `sortBy`  | string | `createAt`   | Поле сортировки: `price`, `createAt`, `name`. |
| `sortOrder` | string | `DESC`    | Направление: `ASC` или `DESC`. |
| `page`    | number | 1            | Номер страницы. |
| `limit`   | number | 20           | Записей на страницу (макс. 100). |

**Примеры:**

- Первая страница: `GET /api/products`
- Поиск: `GET /api/products?search=телефон`
- По категории: `GET /api/products?categoryId=5`
- Диапазон цен: `GET /api/products?minPrice=100&maxPrice=5000`
- Только в наличии: `GET /api/products?inStock=true`
- Сортировка по цене: `GET /api/products?sortBy=price&sortOrder=ASC`
- Пагинация: `GET /api/products?page=2&limit=10`

**Ответ:**

```json
{
  "data": [ /* массив товаров с category и images */ ],
  "total": 42,
  "page": 1,
  "limit": 20
}
```

Каждый элемент в `data`: id, name, slug, description, price, compareAtPrice, sku, quantity, categoryId, isActive, createAt, updateAt, category (объект или null), images (массив с url, sortOrder).

---

### Один товар по id

**`GET /api/products/:id`** — публичный.

**Ответ:** объект товара с полями `category` и `images` (отсортированы по `sortOrder`).

---

### Один товар по slug

**`GET /api/products/slug/:slug`** — публичный.

Пример: `GET /api/products/slug/iphone-15`.

**Ответ:** объект товара с `category` и `images`.

---

### Создать товар

**`POST /api/products`** — JWT, роль **MANAGER** или **ADMIN**.

**Тело запроса (JSON):**

| Поле           | Тип    | Обязательное | Описание |
|----------------|--------|--------------|----------|
| `name`         | string | да           | Название. |
| `slug`         | string | нет          | URL-slug; если не передан — из `name`. |
| `description`  | string | нет          | Описание. |
| `price`        | number | да           | Цена (≥ 0). |
| `compareAtPrice` | number | нет        | Зачёркнутая цена (≥ 0). |
| `sku`          | string | нет          | Артикул. |
| `quantity`     | number | нет          | Остаток (по умолчанию 0). |
| `categoryId`   | number \| null | нет  | Id категории. |
| `images`       | array  | нет          | Массив объектов `{ url: string, sortOrder?: number }`. |
| `isActive`     | boolean | нет        | Активен ли товар (по умолчанию true). |

**Пример тела:**

```json
{
  "name": "Смартфон X",
  "description": "Описание товара",
  "price": 29999.99,
  "compareAtPrice": 34999.99,
  "sku": "PH-X-001",
  "quantity": 10,
  "categoryId": 1,
  "images": [
    { "url": "https://cdn.example.com/1.jpg", "sortOrder": 0 },
    { "url": "https://cdn.example.com/2.jpg", "sortOrder": 1 }
  ],
  "isActive": true
}
```

**Ответ:** созданный товар с `category` и `images`.

---

### Обновить товар

**`PATCH /api/products/:id`** — JWT, роль **MANAGER** или **ADMIN**.

**Тело запроса (JSON):** все поля опциональны.

- Если передан массив `images`, он **полностью заменяет** текущие изображения товара (старые удаляются, сохраняются только переданные).

**Ответ:** обновлённый товар с `category` и `images`.

---

### Удалить товар

**`DELETE /api/products/:id`** — JWT, роль **MANAGER** или **ADMIN**.

**Ответ:** статус 200 без тела. Записи в `product_images` удаляются каскадно.

---

## Коды ответов и ошибки

- **200** — успешный GET/PATCH/DELETE.
- **201** — успешное создание (POST).
- **400 Bad Request** — невалидные данные (тело или query), например неверный формат или нарушение правил (дубликат slug, несуществующая категория и т.п.).
- **401 Unauthorized** — нет или невалидный JWT.
- **403 Forbidden** — недостаточно прав (нужна роль MANAGER/ADMIN).
- **404 Not Found** — категория или товар с указанным id/slug не найден.

Сообщения об ошибках приходят в теле ответа (обычно поле `message`).

---

## Запуск миграций

После добавления каталога нужно применить миграции:

```bash
npm run migration:run
```

Будут созданы таблицы: `categories`, `products`, `product_images`.
