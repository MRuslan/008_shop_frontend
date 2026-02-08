# Интернет-магазин на SvelteKit

Фронтенд интернет-магазина, построенный на SvelteKit с поддержкой SSR/SSG для SEO.

## Установка зависимостей

```bash
# Установка основных зависимостей
npm install

# Установка adapter-node для SSR
npm install -D @sveltejs/adapter-node

# Установка Tailwind CSS (опционально, но рекомендуется)
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

## Настройка Tailwind CSS

Если вы установили Tailwind CSS, обновите `tailwind.config.js`:

```js
/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{html,js,svelte,ts}'],
  theme: {
    extend: {},
  },
  plugins: [],
}
```

## Переменные окружения

Создайте файл `.env` на основе `.env.example`:

```bash
cp .env.example .env
```

И настройте `PUBLIC_API_URL` для вашего бэкенда:

```env
PUBLIC_API_URL=http://localhost:3380/api
```

## Разработка

```bash
npm run dev

# или с автоматическим открытием браузера
npm run dev -- --open
```

## Сборка

```bash
npm run build
```

## Просмотр production сборки

```bash
npm run preview
```

## Структура проекта

- `src/lib/api/` - API клиент и методы
- `src/lib/stores/` - Svelte stores для состояния
- `src/lib/types/` - TypeScript типы
- `src/lib/components/` - Переиспользуемые компоненты
- `src/routes/` - Страницы и роуты SvelteKit

## Основные функции

- ✅ Авторизация и регистрация
- ✅ Управление корзиной (гостевая и авторизованная)
- ✅ Каталог товаров (в разработке)
- ✅ Оформление заказов (в разработке)
- ✅ Личный кабинет (в разработке)
- ✅ Админ-панель (в разработке)

## План разработки

См. файл `PLAN.MD` для детального плана разработки.
