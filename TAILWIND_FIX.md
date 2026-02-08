# Исправление ошибки Tailwind CSS v4

## Проблема
При использовании Tailwind CSS v4 с PostCSS возникает ошибка о необходимости установки `@tailwindcss/postcss`.

## Решение

### Вариант 1: Установить @tailwindcss/postcss (рекомендуется для v4)

```bash
npm install -D @tailwindcss/postcss
```

Конфигурация уже обновлена в `postcss.config.js`.

### Вариант 2: Откатиться на Tailwind CSS v3 (если нужна стабильность)

Если вы предпочитаете использовать стабильную версию Tailwind CSS v3:

```bash
npm uninstall tailwindcss
npm install -D tailwindcss@^3.4.0
```

Затем верните старый синтаксис в `src/lib/styles/global.css`:
```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

И верните старую конфигурацию в `postcss.config.js`:
```js
export default {
	plugins: {
		tailwindcss: {},
		autoprefixer: {}
	}
};
```

## Текущая конфигурация (v4)

- `postcss.config.js` - использует `@tailwindcss/postcss`
- `src/lib/styles/global.css` - использует `@import "tailwindcss"`
- `tailwind.config.js` - конфигурация Tailwind

## После установки

После установки `@tailwindcss/postcss` перезапустите dev сервер:
```bash
npm run dev
```
