# План разработки фронтенда интернет-магазина на SvelteKit

## 1. Архитектура и технические решения

### 1.1 Технологический стек
- **Framework**: SvelteKit 2.x
- **Language**: TypeScript
- **Styling**: CSS/Tailwind CSS (рекомендуется для быстрой разработки)
- **State Management**: Svelte stores (встроенные)
- **HTTP Client**: Fetch API с обёрткой для единообразных запросов
- **Authentication**: JWT (access_token + refresh_token)
- **Session Storage**: localStorage для токенов, sessionStorage для гостевой корзины

### 1.2 SEO стратегия (SSR/SSG)

#### Страницы с SSR (Server-Side Rendering):
- Главная страница (`/`) - динамический контент, акции
- Страницы категорий (`/categories/[slug]`) - актуальные товары
- Страницы товаров (`/products/[slug]`) - детальная информация
- Страница поиска (`/search`) - результаты поиска
- Страница каталога (`/catalog`) - фильтры и товары

#### Страницы с SSG (Static Site Generation):
- О компании (`/about`)
- Контакты (`/contacts`)
- Политика конфиденциальности (`/privacy`)
- Условия использования (`/terms`)

#### Страницы с CSR (Client-Side Rendering):
- Личный кабинет (`/account/*`) - требует авторизации
- Корзина (`/cart`) - динамическое состояние
- Оформление заказа (`/checkout`) - требует авторизации
- Админ-панель (`/admin/*`) - требует роли admin/manager

### 1.3 Конфигурация SvelteKit

```javascript
// svelte.config.js
- Использовать adapter-node для SSR в продакшене
- Или adapter-static для SSG (если нужен полностью статический сайт)
- Настроить prerender для статических страниц
```

---

## 2. Структура проекта

```
src/
├── lib/
│   ├── api/                    # API клиент и эндпоинты
│   │   ├── client.ts           # Базовый HTTP клиент с обработкой токенов
│   │   ├── auth.ts            # Эндпоинты авторизации
│   │   ├── products.ts         # Эндпоинты товаров
│   │   ├── categories.ts       # Эндпоинты категорий
│   │   ├── cart.ts             # Эндпоинты корзины
│   │   ├── orders.ts           # Эндпоинты заказов
│   │   ├── addresses.ts        # Эндпоинты адресов
│   │   ├── reviews.ts          # Эндпоинты отзывов
│   │   ├── wishlist.ts         # Эндпоинты избранного
│   │   ├── store.ts            # Эндпоинты настроек магазина
│   │   └── locations.ts        # Эндпоинты точек продаж
│   ├── stores/                 # Svelte stores
│   │   ├── auth.ts             # Store для авторизации
│   │   ├── cart.ts             # Store для корзины
│   │   ├── store.ts            # Store для настроек магазина
│   │   └── user.ts             # Store для данных пользователя
│   ├── types/                  # TypeScript типы
│   │   ├── api.ts              # Типы API ответов
│   │   ├── auth.ts             # Типы авторизации
│   │   ├── product.ts          # Типы товаров
│   │   ├── order.ts            # Типы заказов
│   │   └── common.ts           # Общие типы
│   ├── components/             # Переиспользуемые компоненты
│   │   ├── ui/                 # UI компоненты
│   │   │   ├── Button.svelte
│   │   │   ├── Input.svelte
│   │   │   ├── Modal.svelte
│   │   │   ├── Card.svelte
│   │   │   └── ...
│   │   ├── layout/             # Компоненты layout
│   │   │   ├── Header.svelte
│   │   │   ├── Footer.svelte
│   │   │   ├── Navigation.svelte
│   │   │   └── Sidebar.svelte
│   │   ├── product/           # Компоненты товаров
│   │   │   ├── ProductCard.svelte
│   │   │   ├── ProductList.svelte
│   │   │   ├── ProductFilters.svelte
│   │   │   ├── ProductGallery.svelte
│   │   │   └── ProductReviews.svelte
│   │   ├── cart/              # Компоненты корзины
│   │   │   ├── CartItem.svelte
│   │   │   ├── CartSummary.svelte
│   │   │   └── CartIcon.svelte
│   │   └── auth/              # Компоненты авторизации
│   │       ├── LoginForm.svelte
│   │       ├── RegisterForm.svelte
│   │       └── AuthModal.svelte
│   ├── utils/                 # Утилиты
│   │   ├── format.ts          # Форматирование (цена, дата)
│   │   ├── validation.ts      # Валидация форм
│   │   ├── session.ts         # Работа с сессией
│   │   └── constants.ts       # Константы
│   └── styles/                # Глобальные стили
│       └── global.css
├── routes/                    # SvelteKit routes
│   ├── +layout.svelte         # Главный layout
│   ├── +layout.server.ts      # Server layout (загрузка настроек магазина)
│   ├── +page.svelte           # Главная страница
│   ├── +page.server.ts        # Server load для главной
│   ├── about/
│   │   └── +page.svelte       # SSG страница
│   ├── catalog/
│   │   ├── +page.svelte       # Каталог товаров
│   │   └── +page.server.ts    # SSR загрузка товаров
│   ├── categories/
│   │   └── [slug]/
│   │       ├── +page.svelte
│   │       └── +page.server.ts
│   ├── products/
│   │   └── [slug]/
│   │       ├── +page.svelte   # Страница товара
│   │       └── +page.server.ts # SSR для SEO
│   ├── search/
│   │   ├── +page.svelte
│   │   └── +page.server.ts
│   ├── cart/
│   │   └── +page.svelte       # CSR корзина
│   ├── checkout/
│   │   ├── +page.svelte       # Оформление заказа
│   │   └── +page.server.ts    # Проверка авторизации
│   ├── account/
│   │   ├── +layout.svelte     # Layout личного кабинета
│   │   ├── +page.svelte       # Профиль
│   │   ├── orders/
│   │   │   ├── +page.svelte
│   │   │   └── [id]/
│   │   │       └── +page.svelte
│   │   ├── addresses/
│   │   │   └── +page.svelte
│   │   └── wishlist/
│   │       └── +page.svelte
│   └── admin/
│       ├── +layout.svelte     # Layout админки
│       ├── +layout.server.ts  # Проверка роли admin/manager
│       ├── products/
│       │   ├── +page.svelte
│       │   └── [id]/
│       │       └── +page.svelte
│       ├── categories/
│       │   └── +page.svelte
│       ├── orders/
│       │   └── +page.svelte
│       └── coupons/
│           └── +page.svelte
├── app.d.ts
└── app.html
```

---

## 3. Функциональные модули

### 3.1 Авторизация и пользователи

**Файлы:**
- `lib/api/auth.ts` - API методы
- `lib/stores/auth.ts` - Store для состояния авторизации
- `lib/types/auth.ts` - Типы
- `components/auth/*` - Компоненты форм

**Функционал:**
- Регистрация (`POST /api/auth/register`)
- Вход (`POST /api/auth/login`)
- Выход (`POST /api/auth/logout`)
- Обновление токенов (`POST /api/auth/refresh`)
- Получение текущего пользователя (`GET /api/auth/me`)
- Удаление аккаунта (`DELETE /api/auth/account`)
- Автоматическое обновление токенов при истечении access_token
- Сохранение токенов в localStorage
- Редирект на логин при 401

**Особенности:**
- Модальное окно для входа/регистрации
- Сохранение refresh_token для автоматического обновления
- Обработка истечения токенов

### 3.2 Каталог товаров

**Файлы:**
- `lib/api/products.ts`, `lib/api/categories.ts`
- `components/product/*`
- `routes/catalog/`, `routes/categories/[slug]/`, `routes/products/[slug]/`

**Функционал:**
- Список категорий с деревом (`GET /api/categories?tree=true`)
- Список товаров с фильтрами (`GET /api/products`)
- Детальная страница товара (`GET /api/products/slug/:slug`)
- Поиск товаров (`GET /api/products?search=...`)
- Фильтры: категория, цена, наличие, активность
- Сортировка: цена, дата, название
- Пагинация

**SEO:**
- SSR для страниц категорий и товаров
- Мета-теги (title, description, og:image)
- Структурированные данные (JSON-LD) для товаров
- Canonical URLs

### 3.3 Корзина

**Файлы:**
- `lib/api/cart.ts`
- `lib/stores/cart.ts`
- `components/cart/*`
- `routes/cart/`

**Функционал:**
- Гостовая корзина (X-Session-Id)
- Корзина авторизованного пользователя (JWT)
- Добавление товара (`POST /api/cart/items`)
- Изменение количества (`PATCH /api/cart/items/:id`)
- Удаление позиции (`DELETE /api/cart/items/:id`)
- Очистка корзины (`DELETE /api/cart`)
- Слияние гостевой корзины при логине (`POST /api/cart/merge-session`)

**Особенности:**
- Генерация sessionId для гостей (UUID)
- Автоматическое слияние корзины при входе
- Синхронизация количества с остатками на складе
- Иконка корзины в header с количеством товаров

### 3.4 Заказы

**Файлы:**
- `lib/api/orders.ts`
- `routes/checkout/`, `routes/account/orders/`

**Функционал:**
- Создание заказа (`POST /api/orders`)
- Список своих заказов (`GET /api/orders`)
- Детали заказа (`GET /api/orders/:id`)
- Смена статуса (для admin/manager) (`PATCH /api/orders/:id/status`)

**Процесс оформления:**
1. Выбор типа доставки (delivery/pickup)
2. Выбор адреса доставки или точки самовывоза
3. Ввод промокода (опционально)
4. Комментарий к заказу
5. Подтверждение и создание заказа

### 3.5 Адреса доставки

**Файлы:**
- `lib/api/addresses.ts`
- `routes/account/addresses/`

**Функционал:**
- Список адресов (`GET /api/addresses`)
- Добавление адреса (`POST /api/addresses`)
- Редактирование (`PATCH /api/addresses/:id`)
- Удаление (`DELETE /api/addresses/:id`)
- Установка адреса по умолчанию (`PATCH /api/addresses/:id/default`)

### 3.6 Отзывы

**Файлы:**
- `lib/api/reviews.ts`
- `components/product/ProductReviews.svelte`

**Функционал:**
- Список отзывов по товару (`GET /api/reviews?productId=:id`)
- Добавление отзыва (`POST /api/reviews`)
- Удаление своего отзыва (`DELETE /api/reviews/:id`)
- Модерация (для moderator/admin) (`PATCH /api/reviews/:id/moderate`)

### 3.7 Избранное (Wishlist)

**Файлы:**
- `lib/api/wishlist.ts`
- `routes/account/wishlist/`

**Функционал:**
- Список избранного (`GET /api/wishlist`)
- Добавление в избранное (`POST /api/wishlist`)
- Удаление (`DELETE /api/wishlist/product/:productId`)

### 3.8 Настройки магазина

**Файлы:**
- `lib/api/store.ts`
- `lib/stores/store.ts`
- `routes/+layout.server.ts` - загрузка при старте

**Функционал:**
- Получение настроек (`GET /api/store`)
- Отображение названия, логотипа, контактов
- Валюта для форматирования цен
- Настройки доставки/оплаты из поля `settings`

### 3.9 Точки продаж (Locations)

**Файлы:**
- `lib/api/locations.ts`

**Функционал:**
- Список точек для самовывоза (`GET /api/locations`)
- Выбор точки при оформлении заказа
- Отображение адреса и графика работы

### 3.10 Админ-панель

**Файлы:**
- `routes/admin/*`
- Проверка ролей в `+layout.server.ts`

**Функционал:**
- Управление товарами (CRUD)
- Управление категориями (CRUD)
- Управление заказами (просмотр, смена статуса)
- Управление купонами (CRUD)
- Управление точками продаж (CRUD)
- Управление настройками магазина (для admin)

**Доступ:**
- `manager` - товары, заказы, купоны, точки
- `admin` - всё + настройки магазина, роли пользователей

---

## 4. SEO оптимизация

### 4.1 Мета-теги

**Для каждой страницы:**
- Уникальный `<title>`
- `<meta name="description">`
- Open Graph теги (`og:title`, `og:description`, `og:image`)
- Twitter Card теги
- Canonical URL

**Реализация:**
- Использовать `svelte:head` в компонентах
- Или `+page.ts` с `export const metadata`

### 4.2 Структурированные данные (JSON-LD)

**Для товаров:**
```json
{
  "@context": "https://schema.org/",
  "@type": "Product",
  "name": "...",
  "description": "...",
  "image": "...",
  "offers": {
    "@type": "Offer",
    "price": "...",
    "priceCurrency": "..."
  }
}
```

**Для организации:**
- Organization schema с контактами магазина

### 4.3 Sitemap и robots.txt

- Генерация sitemap.xml из категорий и товаров
- Настройка robots.txt (уже есть в static/)

### 4.4 Оптимизация производительности

- Lazy loading изображений
- Code splitting для админ-панели
- Оптимизация изображений (WebP, responsive)
- Минификация CSS/JS

---

## 5. Этапы разработки

### Этап 1: Базовая инфраструктура (1-2 дня)
- [ ] Настройка проекта (adapter, конфигурация)
- [ ] Создание базового API клиента
- [ ] Настройка TypeScript типов
- [ ] Создание базовых stores (auth, cart, store)
- [ ] Базовая структура layout (Header, Footer)

### Этап 2: Авторизация (1 день)
- [ ] API методы авторизации
- [ ] Store для auth
- [ ] Компоненты форм входа/регистрации
- [ ] Обработка токенов и refresh
- [ ] Middleware для защищённых роутов

### Этап 3: Каталог товаров (2-3 дня)
- [ ] API методы для товаров и категорий
- [ ] Компоненты ProductCard, ProductList
- [ ] Страница каталога с фильтрами
- [ ] Страница категории
- [ ] Страница товара (SSR для SEO)
- [ ] Поиск товаров

### Этап 4: Корзина (1-2 дня)
- [ ] API методы корзины
- [ ] Store для корзины
- [ ] Гостовая корзина (sessionId)
- [ ] Страница корзины
- [ ] Компонент CartIcon
- [ ] Слияние корзины при логине

### Этап 5: Оформление заказа (2 дня)
- [ ] Страница оформления заказа
- [ ] Выбор типа доставки
- [ ] Управление адресами
- [ ] Выбор точки самовывоза
- [ ] Применение промокода
- [ ] Создание заказа

### Этап 6: Личный кабинет (2 дня)
- [ ] Профиль пользователя
- [ ] История заказов
- [ ] Детали заказа
- [ ] Управление адресами
- [ ] Избранное

### Этап 7: Отзывы и избранное (1 день)
- [ ] Компонент отзывов на странице товара
- [ ] Добавление/удаление отзывов
- [ ] Страница избранного

### Этап 8: Админ-панель (3-4 дня)
- [ ] Проверка ролей в layout
- [ ] Управление товарами
- [ ] Управление категориями
- [ ] Управление заказами
- [ ] Управление купонами
- [ ] Управление точками продаж
- [ ] Настройки магазина (для admin)

### Этап 9: SEO и оптимизация (2 дня)
- [ ] Мета-теги для всех страниц
- [ ] JSON-LD структурированные данные
- [ ] Sitemap генерация
- [ ] Оптимизация изображений
- [ ] Тестирование SSR/SSG

### Этап 10: Полировка и тестирование (2-3 дня)
- [ ] Обработка ошибок
- [ ] Валидация форм
- [ ] Адаптивность (мобильная версия)
- [ ] Тестирование всех сценариев
- [ ] Исправление багов

---

## 6. Переменные окружения

Создать `.env` файл:
```env
PUBLIC_API_URL=http://localhost:3000/api
# или для продакшена
PUBLIC_API_URL=https://api.example.com/api
```

Использовать в коде через `$env/static/public.PUBLIC_API_URL`

---

## 7. Обработка ошибок

### 7.1 API ошибки
- Централизованная обработка в API клиенте
- Показ понятных сообщений пользователю
- Автоматический refresh токена при 401
- Редирект на логин при неудачном refresh

### 7.2 Валидация форм
- Клиентская валидация перед отправкой
- Отображение ошибок валидации
- Блокировка повторной отправки

### 7.3 Обработка сетевых ошибок
- Retry для критичных запросов
- Offline режим (сохранение в localStorage)

---

## 8. Безопасность

- Хранение токенов в localStorage (или httpOnly cookies через proxy)
- Валидация всех пользовательских данных
- Защита от XSS (Svelte автоматически экранирует)
- CSRF защита (если используем cookies)
- Проверка ролей на сервере (в +page.server.ts)

---

## 9. Тестирование

### 9.1 Ручное тестирование
- Все сценарии пользователя
- Разные роли (customer, manager, admin)
- Гостевая корзина и слияние
- Обработка ошибок

### 9.2 Автоматическое тестирование (опционально)
- Unit тесты для утилит
- E2E тесты для критичных сценариев

---

## 10. Дополнительные улучшения

- PWA поддержка (service worker, manifest)
- Кэширование данных (stale-while-revalidate)
- Оптимистичные обновления UI
- Анимации и переходы
- Темная тема (опционально)
- Мультиязычность (i18n)

---

## 11. Документация для разработчиков

- README с инструкциями по запуску
- Комментарии в коде
- Описание API клиента
- Гайд по добавлению новых компонентов

---

## Примечания

- Все публичные страницы (каталог, товары, категории) должны использовать SSR для SEO
- Защищённые страницы (личный кабинет, админка) могут быть CSR
- Важно правильно настроить adapter для продакшена (adapter-node для SSR)
- Учесть ограничения CORS при разработке
- Настроить правильные заголовки для кэширования статических ресурсов
