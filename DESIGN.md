---
name: Витрина магазина
description: White-label витрина как аккуратное мобильное приложение — серый холст, белые карточки, чёрный только для действия.
colors:
  canvas: "#f0f0f2"
  surface: "#ffffff"
  ink: "#0b0b0c"
  ink-hover: "#2a2a2f"
  line: "#e4e4e7"
  muted: "#6a6a71"
  positive: "#1d7a47"
  caution: "#9a5b00"
  negative: "#b42318"
  gray-50: "#f7f7f8"
  gray-100: "#f0f0f2"
  gray-200: "#e4e4e7"
  gray-300: "#d1d1d6"
  gray-400: "#a1a1a8"
  gray-500: "#6a6a71"
  gray-600: "#57575e"
  gray-700: "#414147"
  gray-800: "#2a2a2f"
  gray-900: "#18181b"
  gray-950: "#0b0b0c"
typography:
  headline:
    fontFamily: "'Onest Variable', 'Onest Fallback Segoe', 'Onest Fallback Arial', system-ui, -apple-system, Roboto, sans-serif"
    fontSize: "1.5rem"
    fontWeight: 600
    lineHeight: "2rem"
    letterSpacing: "-0.025em"
  headline-lg:
    fontFamily: "'Onest Variable', 'Onest Fallback Segoe', 'Onest Fallback Arial', system-ui, -apple-system, Roboto, sans-serif"
    fontSize: "1.875rem"
    fontWeight: 600
    lineHeight: "2.25rem"
    letterSpacing: "-0.025em"
  price-lg:
    fontFamily: "'Onest Variable', 'Onest Fallback Segoe', 'Onest Fallback Arial', system-ui, -apple-system, Roboto, sans-serif"
    fontSize: "1.875rem"
    fontWeight: 600
    lineHeight: "2.25rem"
    letterSpacing: "-0.025em"
  price-md:
    fontFamily: "'Onest Variable', 'Onest Fallback Segoe', 'Onest Fallback Arial', system-ui, -apple-system, Roboto, sans-serif"
    fontSize: "1.25rem"
    fontWeight: 600
    lineHeight: "1.75rem"
    letterSpacing: "-0.025em"
  price:
    fontFamily: "'Onest Variable', 'Onest Fallback Segoe', 'Onest Fallback Arial', system-ui, -apple-system, Roboto, sans-serif"
    fontSize: "1.125rem"
    fontWeight: 600
    lineHeight: "1.75rem"
    letterSpacing: "-0.025em"
  title:
    fontFamily: "'Onest Variable', 'Onest Fallback Segoe', 'Onest Fallback Arial', system-ui, -apple-system, Roboto, sans-serif"
    fontSize: "1.125rem"
    fontWeight: 600
    lineHeight: "1.75rem"
  title-sm:
    fontFamily: "'Onest Variable', 'Onest Fallback Segoe', 'Onest Fallback Arial', system-ui, -apple-system, Roboto, sans-serif"
    fontSize: "1rem"
    fontWeight: 600
    lineHeight: "1.5rem"
  body:
    fontFamily: "'Onest Variable', 'Onest Fallback Segoe', 'Onest Fallback Arial', system-ui, -apple-system, Roboto, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.625
  body-sm:
    fontFamily: "'Onest Variable', 'Onest Fallback Segoe', 'Onest Fallback Arial', system-ui, -apple-system, Roboto, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: "1.25rem"
  control:
    fontFamily: "'Onest Variable', 'Onest Fallback Segoe', 'Onest Fallback Arial', system-ui, -apple-system, Roboto, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 500
    lineHeight: "1.25rem"
  control-lg:
    fontFamily: "'Onest Variable', 'Onest Fallback Segoe', 'Onest Fallback Arial', system-ui, -apple-system, Roboto, sans-serif"
    fontSize: "1rem"
    fontWeight: 500
    lineHeight: "1.5rem"
  label:
    fontFamily: "'Onest Variable', 'Onest Fallback Segoe', 'Onest Fallback Arial', system-ui, -apple-system, Roboto, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 400
    lineHeight: "1rem"
  tab:
    fontFamily: "'Onest Variable', 'Onest Fallback Segoe', 'Onest Fallback Arial', system-ui, -apple-system, Roboto, sans-serif"
    fontSize: "0.6875rem"
    fontWeight: 500
    lineHeight: "1rem"
rounded:
  md: "6px"
  lg: "8px"
  xl: "12px"
  2xl: "16px"
  3xl: "24px"
  full: "9999px"
spacing:
  card-inset-mobile: "10px"
  card-inset: "12px"
  panel-inset: "20px"
  grid-gap-mobile: "8px"
  grid-gap: "12px"
  column-gap: "24px"
  container-inline-mobile: "16px"
  container-inline: "24px"
  control-height: "44px"
  control-height-lg: "52px"
  tabbar-height: "56px"
components:
  button-primary:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.surface}"
    typography: "{typography.control}"
    rounded: "{rounded.xl}"
    padding: "0 20px"
    height: "44px"
  button-primary-hover:
    backgroundColor: "{colors.ink-hover}"
  button-primary-lg:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.surface}"
    typography: "{typography.control-lg}"
    rounded: "{rounded.xl}"
    height: "52px"
  button-secondary:
    backgroundColor: "{colors.gray-100}"
    textColor: "{colors.ink}"
    typography: "{typography.control}"
    rounded: "{rounded.xl}"
    padding: "0 20px"
    height: "44px"
  button-secondary-hover:
    backgroundColor: "{colors.gray-200}"
  button-danger:
    backgroundColor: "{colors.negative}"
    textColor: "{colors.surface}"
    typography: "{typography.control}"
    rounded: "{rounded.xl}"
    padding: "0 20px"
    height: "44px"
  button-text:
    textColor: "{colors.gray-700}"
    typography: "{typography.control}"
    rounded: "{rounded.md}"
    padding: "0 4px"
    height: "44px"
  button-text-hover:
    textColor: "{colors.ink}"
  button-unavailable:
    backgroundColor: "{colors.gray-100}"
    textColor: "{colors.gray-500}"
    rounded: "{rounded.xl}"
    height: "44px"
  input-field:
    backgroundColor: "{colors.gray-100}"
    textColor: "{colors.ink}"
    typography: "{typography.body}"
    rounded: "{rounded.xl}"
    padding: "10px 16px"
    height: "44px"
  input-field-focus:
    backgroundColor: "{colors.surface}"
  input-field-invalid:
    backgroundColor: "{colors.surface}"
  field-label:
    textColor: "{colors.gray-800}"
    typography: "{typography.body-sm}"
  field-hint:
    textColor: "{colors.gray-600}"
    typography: "{typography.body-sm}"
  field-error:
    textColor: "{colors.negative}"
    typography: "{typography.body-sm}"
  notice-error:
    backgroundColor: "color-mix(in oklab, #b42318 8%, transparent)"
    textColor: "{colors.negative}"
    typography: "{typography.body-sm}"
    rounded: "{rounded.xl}"
    padding: "12px 16px"
  notice-caution:
    backgroundColor: "color-mix(in oklab, #9a5b00 10%, transparent)"
    textColor: "{colors.gray-900}"
    typography: "{typography.body-sm}"
    rounded: "{rounded.xl}"
    padding: "12px 16px"
  notice-success:
    backgroundColor: "color-mix(in oklab, #1d7a47 10%, transparent)"
    textColor: "{colors.positive}"
    typography: "{typography.body-sm}"
    rounded: "{rounded.xl}"
    padding: "12px 16px"
  link:
    textColor: "{colors.ink}"
  chip:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.gray-800}"
    typography: "{typography.control}"
    rounded: "{rounded.full}"
    padding: "0 16px"
    height: "44px"
  chip-hover:
    backgroundColor: "{colors.gray-200}"
  chip-active:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.surface}"
  sort-tab:
    textColor: "{colors.gray-600}"
    typography: "{typography.control}"
    rounded: "{rounded.xl}"
    padding: "0 12px"
    height: "44px"
  sort-tab-active:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
  segmented-control:
    backgroundColor: "{colors.gray-100}"
    rounded: "{rounded.xl}"
    padding: "4px"
  segmented-tab:
    textColor: "{colors.gray-600}"
    typography: "{typography.control}"
    rounded: "{rounded.lg}"
    padding: "0 16px"
    height: "44px"
  segmented-tab-active:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
  side-menu-item:
    textColor: "{colors.gray-700}"
    typography: "{typography.control}"
    rounded: "{rounded.xl}"
    padding: "0 12px"
    height: "44px"
  side-menu-item-hover:
    backgroundColor: "{colors.gray-50}"
    textColor: "{colors.ink}"
  side-menu-item-active:
    backgroundColor: "{colors.gray-100}"
    textColor: "{colors.ink}"
  pagination-item:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.gray-800}"
    rounded: "{rounded.xl}"
    height: "44px"
    width: "44px"
  pagination-item-active:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.surface}"
  product-card:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.2xl}"
    padding: "12px"
  image-well:
    backgroundColor: "{colors.gray-50}"
    rounded: "{rounded.xl}"
  panel:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.2xl}"
    padding: "20px"
  discount-plate:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.surface}"
    typography: "{typography.label}"
    rounded: "{rounded.md}"
    padding: "2px 6px"
  selection-card:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.xl}"
    padding: "16px"
  selection-card-unavailable:
    backgroundColor: "{colors.gray-50}"
  order-row:
    backgroundColor: "{colors.gray-50}"
    rounded: "{rounded.xl}"
    padding: "16px"
  order-row-hover:
    backgroundColor: "{colors.gray-100}"
  status-badge:
    backgroundColor: "{colors.gray-100}"
    textColor: "{colors.gray-800}"
    typography: "{typography.label}"
    rounded: "{rounded.full}"
    padding: "4px 10px"
  skeleton:
    backgroundColor: "{colors.gray-200}"
    rounded: "{rounded.md}"
  cart-stepper:
    backgroundColor: "{colors.gray-100}"
    textColor: "{colors.gray-900}"
    rounded: "{rounded.xl}"
    height: "44px"
  cart-badge:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.surface}"
    rounded: "{rounded.full}"
    height: "20px"
    width: "20px"
  tab-bar:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.gray-500}"
    typography: "{typography.tab}"
    height: "56px"
  tab-bar-active:
    textColor: "{colors.ink}"
  bottom-sheet:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.3xl}"
  toast:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.surface}"
    typography: "{typography.body-sm}"
    rounded: "{rounded.2xl}"
    padding: "12px 8px 12px 16px"
  dialog:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.2xl}"
    padding: "20px"
  navigation-progress:
    backgroundColor: "{colors.ink}"
    height: "2px"
---

# Design System: Витрина магазина

## Overview

**Creative North Star: "Аккуратное приложение"**

Витрина ведёт себя как хорошо собранное мобильное приложение, а не как маркетплейсная лента: покупка идёт по вкладкам и карточкам, на первом экране сразу видно, что это, сколько стоит и есть ли в наличии. Мир нейтральный и перекрашиваемый: премиальный холодный серый холст, белые карточки без рамок и теней, чёрный как единственный цвет действия. Платформа не несёт собственного бренда, поэтому всё, что различает магазины, живёт в семантических токенах, а не в компонентах.

Плотность и компоновка следуют Ситилинку (citilink.ru): шапка с кнопкой «Каталог» и широким поиском, нижняя панель вкладок на телефоне, быстрые чипсы разделов, сортировка строкой, карточка с ценой над названием, строкой остатка и кнопкой «В корзину», липкий блок покупки справа в карточке товара. От ориентира сознательно не взяты баннеры, ярлыки акций, бонусы и оранжевый цвет. Цвет и движение здесь рабочие инструменты: движение подтверждает действие на месте, цвет говорит о статусе, но всегда в паре со словом.

Сначала телефон: сетка в две колонки, цели касания от 44px, закреплённые снизу элементы стоят над панелью вкладок. Десктоп расширяет ту же систему (служебная строка, боковая панель фильтров, до четырёх колонок), а не вводит другую.

**Key Characteristics:**
- Серый холст, белые карточки радиусом 16px, ни рамок, ни теней в покое.
- Чёрная заливка только у действий и активного состояния.
- Один шрифт, Onest; иерархия размером и весом 600 (700 не используется), цены пропорциональными цифрами.
- Фото товара на светло-сером колодце с `mix-blend-multiply`.
- Статус остатка словом и точкой; скидка чёрной плашкой «−N%».
- Подпись системы: «В корзину» на месте превращается в степпер «− N +».

## Colors

Ахроматическая шкала холодного графита с тремя приглушёнными статусными тонами; единственный «акцент» — почти чёрный.

### Primary
- **Графитовая тушь** (ink): заливка основных действий («В корзину», «Каталог», «Показать N товаров», «Попробовать снова»), активный чипс, активная страница пагинации, счётчик корзины, плашка скидки, фон тоста. Как цвет текста — заголовки, цены, активная вкладка и активная сортировка. Цвет обводки фокуса и выделения текста.
- **Тушь под рукой** (ink-hover): наведение на чёрные кнопки; осветление на одну ступень вместо смены оттенка.

### Neutral
- **Туманный холст** (canvas, равен gray-100): фон страницы под всеми карточками. Разница с белым карточек — главный способ показать глубину.
- **Белая карточка** (surface): карточки товаров, панели, шапка, подвал, панель вкладок, нижний лист, неактивные чипсы и страницы.
- **Тонкая линия** (line, равен gray-200): единственная допустимая линия — разделители внутри панелей (в том числе между разделами форм админки), нижняя граница служебной строки, верхняя граница вкладок, полосы покупки и подвала; ещё рамка 2px карточки выбора в покое. Не обводка карточек.
- **Приглушённый графит** (muted / gray-500): вторичный текст, подписи, счётчик «16 товаров», плейсхолдеры, неактивные вкладки. Держит 4.5:1 и на белом, и на холсте.
- **Колодец** (gray-50): подложка фото товара и миниатюр (в том числе в строке корзины), плитки заказов в «Мои заказы», недоступная карточка выбора, наведение на пункт бокового меню.
- **Подложка контрола** (gray-100): поля ввода, степпер, вторичные кнопки, недоступная кнопка «Нет в наличии», плашки статуса, дорожка сегментного переключателя, активный пункт бокового меню; наведение на них — gray-200.
- gray-200 с прозрачностью 0.7 — скелетоны загрузки; gray-300 — выключенный тумблер, неактивные точки галереи, подчёркивание ссылок, рамка карточки выбора при наведении; gray-400 — иконки-заглушки, точка «нет в наличии» и «Неактивен», выключенный «+»; gray-500 — точка «Подтверждён»; gray-600…gray-800 — основной текст интерфейса и названий; gray-900 — цвет текста `body` и предупреждения `notice-caution`.

### Статусы
- **Есть на складе** (positive): точка «В наличии N шт.», точки «Доставлен» / «Получен» и «Активен», текст и подложка 10% уведомления об успехе.
- **Мало** (caution): точка и текст «Осталось N шт.» при остатке 3 и меньше, точка «Ожидает подтверждения», подложка 10% предупреждения (текст в нём gray-900).
- **Ошибка** (negative): текст ошибок полей и уведомления об ошибке (подложка 8%), кольцо поля с `aria-invalid`, точка «Отменён», текст деструктивных входов («Удалить», «Очистить корзину», «Удалить аккаунт»), подложка 8% при наведении на иконку удаления. Заливка negative — только у финального необратимого подтверждения (`btn-danger`).
- Строка скидки в итогах заказа набирается positive.

### Named Rules
**The Black Means Act Rule.** Чёрная заливка (ink) принадлежит только действиям и активному состоянию: основные кнопки, активный чипс и страница, счётчик корзины, плашка скидки, тост. Второстепенные зоны не заливаются чёрным: подвал намеренно светлая белая полоса.

**The Word-First Status Rule.** Цвет статуса всегда дублирует слово, а не заменяет его: точка 6px плюс текст «В наличии 14 шт.» / «Осталось 3 шт.» / «Нет в наличии». Так же статус заказа (ожидает — caution, подтверждён — gray-500, передан в доставку / готов к выдаче — ink, доставлен / получен — positive, отменён — negative) и активность в админке (positive против gray-400): слово и точка на нейтральной плашке gray-100, а не цветная плашка. Уведомления в потоке несут цвет тонированной подложкой рядом со словом. Скидка — чёрная плашка, никогда не красная.

**The Semantic Roles Only Rule.** Все экраны — витрина, корзина, оформление, кабинет и админка — красятся только семантическими ролями (canvas, surface, ink, ink-hover, line, muted, positive, caution, negative) и серой шкалой. Других хроматических шкал в `@theme` нет; цвет, которого нет среди ролей, в разметку не попадает.

## Typography

**Display Font:** Onest Variable (с метрически подогнанными заменителями Onest Fallback Segoe и Onest Fallback Arial, затем system-ui, -apple-system, Roboto)
**Body Font:** Onest Variable
**Label/Mono Font:** нет, одно семейство на всё

**Character:** Современный гротеск с кириллицей, спокойный и деловой; иерархия строится размером и весом 600 против 400/500 и плотным трекингом −0.025em у заголовков и цен, без второго шрифта. Сглаживание antialiased. Оптического размера у Onest нет, поэтому `font-optical-sizing` не задаётся.

**Заменители на время загрузки.** Два `@font-face` на локальных системных шрифтах подогнаны под метрики Onest, чтобы после подмены текст не перескакивал: Onest Fallback Segoe (Segoe UI, size-adjust 103.8%, ascent 93.5%, descent 29.4%) и Onest Fallback Arial (Arial, 103%, 94.2%, 29.6%), line-gap 0 у обоих. Предзагрузка шрифта измерена и отклонена: на медленном 4G она задерживала первую отрисовку.

### Hierarchy
Каждая роль — токен кегля в `@theme` (`--text-<роль>` с подсвойствами интерлиньяжа, трекинга и насыщенности); утилита `text-<роль>` задаёт всё разом.

- **Headline** (600, 1.5rem, строка 2rem, −0.025em): заголовки страниц на телефоне, заголовки экранов кабинета и админки.
- **Headline-lg** (600, 1.875rem, строка 2.25rem, −0.025em): заголовок страницы с 768px (`text-headline md:text-headline-lg`, с `text-balance`). Название товара — отдельный размер 1.25rem → 1.5rem с 768px, чтобы цена 30px в блоке покупки оставалась самым крупным элементом.
- **Price-lg** (600, 1.875rem, строка 2.25rem, −0.025em): цена в блоке покупки карточки товара.
- **Price-md** (600, 1.25rem, строка 1.75rem, −0.025em): итоги корзины, оформления и заказа, цена в полосе покупки, цена в карточке списка с 640px.
- **Price** (600, 1.125rem, строка 1.75rem, −0.025em): цена в карточке списка на телефоне, сумма строки в корзине и заказе.
- **Title** (600, 1.125rem, строка 1.75rem): заголовки панелей («Описание», «Отзывы», «Фильтры») и разделов кабинета, оформления, админки.
- **Title-sm** (600, 1rem, строка 1.5rem): заголовки внутри панелей: адрес, пункт выдачи, строка заказа, колонки подвала, легенды групп полей в формах админки.
- **Body** (400, 1rem, 1.625): описание товара, ширина до 36rem.
- **Body-sm** (400, 0.875rem, строка 1.25rem): название в карточке (две строки, `line-clamp-2`), крошки, строки фильтров, тосты, вторичные строки (цена за штуку в корзине — gray-600), подписи, подсказки и ошибки полей, уведомления в потоке, ячейки таблиц админки.
- **Control** (500, 0.875rem, строка 1.25rem): подписи кнопок, чипсов, сортировки, пагинации, пунктов бокового меню и сегментного переключателя.
- **Control-lg** (500, 1rem, строка 1.5rem): подпись большой кнопки 52px («Оформить заказ», основное действие главной).
- **Label** (400, 0.75rem, строка 1rem): остаток, старая цена, плашка скидки (600), подписи иконок в шапке; бейджи статуса заказа и активности, «По умолчанию», тип пункта выдачи и заголовки столбцов таблиц админки (gray-500) — 500.
- **Tab** (500, 0.6875rem, строка 1rem): подписи нижних вкладок и цифра счётчика корзины (600).

Заголовки групп фильтров («Цена, ₽», «Категории», «Только в наличии») — 0.875rem / 600; активный пункт фильтра выделяется 500 и подложкой, а не жирным.

### Named Rules
**The Proportional Price Rule.** Цены и статичные числа набираются пропорциональными цифрами: табличная «1» у Onest разрывает «15 990» визуально. `tabular-nums` только там, где цифры меняются на месте: число в степпере, счётчик корзины, номера пагинации, счётчик активных фильтров, поля цены при наборе. (Контракт направления называл цены «табличными цифрами»; сборка это опровергла, решение сборки главнее.)

**The One Family Rule.** Никакого второго шрифта и системных шрифтов для заголовков: иерархия только весом, размером и трекингом Onest.

**The Size-Not-Bold Rule.** Насыщенность в системе — 400, 500 и 600; 700 не используется нигде. Иерархию несёт размер роли плюс 600, активное состояние — подложка и цвет, а не прибавка веса.

**The One Price Family Rule.** Любая цена набирается одной из трёх ролей price (price, price-md, price-lg) с одинаковым трекингом и весом; вторичная цена (за штуку, старая) уходит в body-sm или label серым. Копейки показываются целиком или никак: «1 234 567,50 ₽», а не «1 234 567,5 ₽».

**The 16px Field Rule.** Текст в полях ввода на телефоне не меньше 16px, чтобы iOS не увеличивал страницу при фокусе; уменьшать разрешено только с широких брейкпоинтов (поиск в шапке 15px с 768px, поля цены 14px с 1024px).

**The Unbroken Unit Rule.** Между числом и единицей стоит неразрывный пробел: «14 шт.», «16 товаров» не разрываются переносом.

## Layout

Контейнер шириной до 1280px с полями 16px на телефоне и 24px с 768px; вертикальные отступы задаёт страница (16px / 24px сверху). Ритм на базе 4px.

- **Сетка товаров:** на телефоне `repeat(auto-fit, minmax(max(8.5rem, (100% − 0.75rem) / 2), 1fr))` — обычно 2 колонки, а при 200% текста одна, без горизонтальной прокрутки (зазор 8px, с 640px — 12px); 3 с 768px, 4 с 1280px, если рядом нет боковой панели.
- **Каталог на десктопе (с 1024px):** боковая панель фильтров 16rem, липкая с отступом 16px, и контент справа, зазор 24px. Чипсы разделов на десктопе скрыты: те же разделы уже в панели.
- **Кабинет и админка** стоят на той же сетке: контейнер с отступом сверху 16px / 24px с 768px; с 1024px — колонки 16rem и `minmax(0, 1fr)` с зазором 24px, слева липкая (16px) белая панель бокового меню, справа содержимое. На телефоне меню заменяет строка чипсов разделов, как в каталоге, с отступом 12px до содержимого; в кабинете внизу страницы — текстовое действие «Выйти из аккаунта». Пока проверяется вход, стоит скелетон той же сетки.
- **Карточка товара (с 1024px):** галерея слева и липкий блок покупки 23rem справа, зазор 24px; ниже — описание и отзывы в левой колонке. На телефоне всё в одну колонку с зазором 12px.
- **Шапка:** на десктопе служебная строка 36px (телефон, «Контакты и пункты выдачи», «Админ-панель»), под ней логотип, чёрная «Каталог», широкий поиск на всю оставшуюся ширину и подписанные иконки «Войти / Избранное / Корзина». На телефоне — название магазина (1.125rem → 1.25rem с 768px, 600) и поле поиска строкой ниже, без гамбургера.
- **Низ телефона:** панель вкладок высотой 56px (`--tabbar-height`) плюс safe-area; всё закреплённое снизу (полоса покупки, тосты) стоит над ней. Страница получает нижний отступ под панель. В админке панели вкладок нет.
- **Полоса прокрутки** корня видна всегда (`overflow-y: scroll`): иначе при переходе между длинной и короткой страницей макет сдвигается вбок на её ширину.
- **Горизонтальные ряды** (чипсы, сортировка, крошки) на узком экране прокручиваются без полосы; ряд сортировки гаснет маской к правому краю. Чипс не шире 16rem, длинное название обрезается многоточием.

**The 44px Rule.** Любая цель касания не меньше 44px: кнопки, чипсы, вкладки сортировки, страницы, иконки-кнопки, ссылки подвала. Основная кнопка покупки на странице товара — 52px.

## Elevation & Depth

Система плоская: глубина передаётся тоном — белая карточка на сером холсте, серый колодец внутри белой карточки. Рамок у карточек нет, линия `line` только разделяет. Тень появляется как отклик на состояние или у временного слоя поверх страницы.

### Shadow Vocabulary
- **Отклик карточки** (`box-shadow: 0 4px 16px rgb(0 0 0 / 0.06)`): только при наведении на карточку товара, переход 200ms.
- **Временный слой** (`box-shadow: 0 8px 24px rgb(0 0 0 / 0.18)`): тёмная плашка тоста и белые диалоги (подтверждение, вход), парящие над контентом.
- **Затемнение** (`rgb(0 0 0 / 0.4)`): фон под нижним листом фильтров и под диалогами.

### Named Rules
**The Flat-At-Rest Rule.** В покое ни одна поверхность не отбрасывает тень и не имеет обводки; тень — это состояние (наведение) или временный слой (тост, диалог), а не декор. Вложенность внутри панели передаётся тоном (плитка gray-50) или линией-разделителем, а не рамкой и тенью. Единственная рамка — 2px у карточки выбора: это состояние радиокнопки, а не контур карточки.

## Shapes

Мягкие скруглённые прямоугольники, вложенные с убыванием радиуса: карточка, панель и диалог 16px, всё внутри — колодец фото, кнопки, поля, степпер, вкладки сортировки, миниатюры, пункты бокового меню, карточки выбора, плитки заказов, уведомления — 12px. Строки фильтров и активная плитка сегментного переключателя 8px, плашка скидки, ссылки крошек и текстовые действия 6px. Нижний лист — 24px только по верхним углам. Полностью круглые: чипсы разделов, счётчик корзины, кнопка «в избранное» в карточке, тумблер «Только в наличии», плашки статуса, точки статуса и галереи.

**The Nested Radius Rule.** Внешний контейнер 16px, элемент внутри 12px; радиус внутри никогда не больше внешнего.

Иконки — Lucide, контурные, 16–24px, толщина по умолчанию; в активной вкладке толщина 2.25 против 1.75 у неактивной. Сердце «в избранном» заливается `currentColor`. Меню кабинета и админки и действия в админке тоже несут Lucide (package, map-pin, heart, user, layout-dashboard, log-out, folder-tree, shopping-cart, ticket-percent, settings, eye, pencil, trash-2), а не эмодзи; кнопки создания — Lucide plus, а не текстовый «+».

## Components

### Buttons
Уверенные и тихие: плотная чёрная плитка без градиентов и теней. Общие утилиты `btn-*` из `global.css` используют все экраны форм: корзина, оформление, кабинет, админка, вход.
- **Shape:** скругление 12px, высота не меньше 44px, поля по 20px, подпись control, иконка Lucide перед подписью с зазором 8px. Высоту держит `min-height`; вертикальные поля 8px нужны, когда длинная подпись переносится на вторую строку.
- **Size:** большая кнопка (`btn-lg`, 52px, подпись control-lg) — основное действие экрана («Оформить заказ», «Перейти в каталог»). Высота, поля и кегль заданы переменными (`--btn-height`, `--btn-padding`, `--btn-font-size`), поэтому модификатор размера и ширина из разметки не спорят с базой.
- **States (все варианты):** смена цвета за 150ms; `disabled` — прозрачность 0.5 и `not-allowed`; ожидание — `aria-busy` и прозрачность 0.7.
- **Primary:** заливка ink, белый текст 500; наведение — ink-hover, нажатие — `scale(0.98)`.
- **Secondary:** подложка gray-100, текст ink, наведение gray-200 («Написать отзыв», «в избранное» рядом с покупкой, «Отмена» в диалоге).
- **Danger:** заливка negative, белый текст, наведение — negative, затемнённый на 12%. Только финальное необратимое подтверждение: «Удалить» в диалоге подтверждения, «Удалить аккаунт навсегда», «Отменить заказ» после ввода причины.
- **Text:** без заливки, control gray-700, при наведении ink и подчёркивание; высота 44px, скругление 6px («Изменить», «Отмена», «Удалить» в строке, «Выйти из аккаунта»).
- **Деструктивный вход:** первое нажатие на разрушительное действие — `btn-secondary` или `btn-text` с текстом negative; красная заливка появляется только на шаге подтверждения.
- **Unavailable:** gray-100 и gray-500, `disabled`, текст «Нет в наличии» вместо кнопки покупки.
- **Иконки-кнопки:** 44px, скругление 12px, gray-600; наведение gray-100 и ink, у удаления — подложка negative 8% и текст negative.
- **Ссылки и текстовые действия витрины:** ссылка в тексте (`link`) — ink с подчёркиванием gray-300 и смещением 4px, при наведении подчёркивание темнеет до ink; «Сбросить фильтры» — тот же приём с текстом gray-600; «Перейти в корзину» — ink без заливки с наведением gray-50.
- **Focus:** глобальная обводка 2px ink со смещением 2px; на тёмном тосте — белая.

### Chips
- **Style:** круглые, высота 44px, поля 16px, не шире 16rem с обрезкой подписи, белые на холсте, текст control gray-800; наведение gray-200.
- **State:** активный — ink и белый текст, `aria-current="page"`. Первый чипс — «Все товары» / «Все в разделе».

### Sort Tabs
Строка ссылок без подложки, текст control (500) gray-600, наведение ink; активная — белая плитка 12px и ink тем же весом 500: состояние несут подложка и цвет, а не насыщенность. Рядом на телефоне белая кнопка «Фильтры» со счётчиком активных фильтров (чёрный круг 20px).

### Segmented Control
Переключатель «Вход / Регистрация» в окне входа повторяет приём сортировки на белом фоне: дорожка gray-100 12px с полями 4px, вкладки 44px с полями 16px, control gray-600 → ink; активная — белая плитка 8px и ink. Роли `tablist` / `tab`, стрелки переключают вкладки.

### Cards / Containers
- **Corner Style:** 16px.
- **Background:** surface на canvas.
- **Shadow Strategy:** плоско в покое, отклик при наведении (см. Elevation & Depth).
- **Border:** нет; фокус ссылки внутри рисует обводку ink вокруг всей карточки.
- **Internal Padding:** карточка товара 10px → 12px с 640px; панели 20px (24px с 768px у описания и отзывов).
- **Плитки внутри панели:** строки «Мои заказы» — плоские плитки gray-50 12px с полями 16px, наведение gray-100, без рамки и тени. Формы админки — разделы одной панели, отделённые линией line снизу (отступ 24px), а не вложенные серые коробки.
- **Карточка товара, порядок сверху вниз:** квадратный колодец gray-50 с фото (`object-contain`, поля 12px, `mix-blend-multiply`; без остатка — прозрачность 0.5 и grayscale), кнопка-сердце в углу; строка 20px со старой ценой и плашкой «−N%»; цена (price, с 640px price-md); название в две строки с переносом длинных слов (вся карточка кликабельна); строка остатка; «В корзину» на всю ширину, прижата к низу.

### Inputs / Fields
- **Style:** без обводки, подложка gray-100, 12px, высота не меньше 44px, поля 16px по горизонтали и 10px по вертикали, текст ink 16px (см. The 16px Field Rule), плейсхолдер gray-500.
- **Focus:** подложка становится белой, кольцо 2px ink.
- **Error / Disabled:** с `aria-invalid` — белая подложка и кольцо 2px negative, под полем одна ошибка body-sm negative; `disabled` — прозрачность 0.6.
- **Подписи:** над полем body-sm 500 gray-800 с отступом 6px, под полем подсказка body-sm gray-600.
- **Флажки и радиокнопки:** нативные, `accent-color` ink, а не синие по умолчанию браузера.
- **Тумблер:** 48×28px, выключен gray-300, включён ink, белый бегунок сдвигается за 200ms.

### Selection Cards
Выбор способа получения, пункта выдачи и адреса в оформлении: карточка 12px с рамкой 2px и полями 16px вокруг нативной радиокнопки. В покое рамка line, при наведении gray-300, выбранная — ink; недоступный вариант — подложка gray-50 и `not-allowed`. Фокус клавиатуры рисует кольцо 2px ink со смещением 2px вокруг всей карточки. Рамка здесь — состояние выбора, а не контур карточки.

### Notices
Уведомления в потоке страницы: 12px, поля 16px × 12px, body-sm. Ошибка — подложка negative 8% и текст negative; предупреждение — подложка caution 10% и текст gray-900; успех — подложка positive 10% и текст positive.

### Status Badges
Статус заказа (одинаково в кабинете и админке) и активность в админке: круглая плашка gray-100 с полями 10px × 4px, label 500 gray-800, слово и точка 6px (цвета — см. The Word-First Status Rule). У самовывоза свои слова: «Готов к выдаче» вместо «Передан в доставку», «Получен» вместо «Доставлен». Выключенное состояние — точка gray-400 и текст gray-600.

### Tables (админка)
Заголовки столбцов — label 500 gray-500, ячейки — body-sm (основное значение gray-900 500, вторичное gray-500), поля 16px × 12px; действия в строке — текстовые кнопки или иконки-кнопки 44px. Легенды групп полей в формах — title-sm.

### Navigation
- **Десктоп:** служебная строка gray-500 14px с наведением ink; иконки действий 22px с подписью 12px под ними, gray-600 → ink; счётчик корзины в углу иконки.
- **Телефон:** только нижняя панель вкладок «Главная, Каталог, Корзина, Избранное, Профиль/Войти»: белая, верхняя линия line, иконки 24px, активная вкладка ink с толстой обводкой, остальные gray-500. Гостю «Избранное» и «Профиль» открывают окно входа. Гамбургера в шапке нет.
- **Крошки:** 14px gray-500, шеврон gray-400, текущая страница gray-700; на телефоне последняя крошка скрыта, а ряд из двух крошек не показывается.
- **Пагинация:** белые квадраты 44px, текущая — ink; «Назад / Вперёд» с подписью с 640px; разрывы многоточием.
- **Боковое меню кабинета и админки (с 1024px):** белая панель 16px с полями 20px и заголовком title; пункты 44px, 12px, control с иконкой Lucide 18px; обычный gray-700, наведение gray-50 и ink, текущий — gray-100 и ink с `aria-current="page"`. Выход отделён линией line. На телефоне те же разделы — строка чипсов со своей подписью `aria-label`.

### Page Transitions
Смена раздела — растворение старой страницы в новой через View Transitions за 180ms, ease-out-quart; переход начинается, когда данные новой страницы готовы. Шапка, нижние вкладки и полоса загрузки в переходе не участвуют (свои имена `site-header`, `tab-bar`, `nav-progress`) и меняются сразу. Переход пропускается при смене только параметров на том же пути (фильтры, сортировка, страница) и при reduced motion.
- **Полоса загрузки:** линия 2px ink вдоль верхнего края, появляется, только если переход дольше 150ms; ползёт к 90% с замедлением, по завершении добегает до конца и гаснет за 300ms.
- **Скелетоны:** заглушки повторяют форму будущего содержимого (сетка карточек товара, сетка кабинета и админки с меню), чтобы вёрстка не прыгала; gray-200 с прозрачностью 0.7, пульсация только без reduced motion.

### Dialogs
Нативный `<dialog>` по центру: белая поверхность 16px шириной до 28rem (на телефоне с полями 16px), поля 20px → 24px с 768px, тень временного слоя и затемнение 40%. Заголовок title ink, пояснение body-sm gray-600; кнопки справа, на телефоне столбиком с подтверждением сверху: «Отмена» — secondary, подтверждение — primary или danger для необратимого. Закрывается фоном, Esc и крестиком 44px.

### Toast
Тёмная плашка как снэкбар мобильного приложения: ink, 16px, текст 14px, иконка gray-300 (ошибка — светло-красная), кнопка закрытия 44px. На телефоне стоит над вкладками на всю ширину с полями 12px, на десктопе справа снизу шириной 24rem. Появляется подъёмом на 16px за 220ms, при reduced motion без анимации.

### Signature: «В корзину» → степпер
Кнопка «В корзину» после добавления на том же месте превращается в степпер «− N +» на подложке gray-100 (`animate-swap-in`: 200ms, прозрачность и `scale(0.96 → 1)`, ease-out-quart), и фокус переезжает на «+»; при уходе в ноль возвращается кнопка и фокус на неё. «+» выключается, когда достигнут остаток. Одновременно счётчик корзины на вкладке и в шапке вздрагивает (`animate-bump`: 320ms, `scale(1 → 1.22 → 1)`) — только когда число выросло, не при первой загрузке корзины. На странице товара под степпером появляется «Перейти в корзину».

### Cart Line
Строка корзины — белая карточка 16px с полями 16px → 20px с 640px: миниатюра 80px на колодце gray-50 12px с `mix-blend-multiply`, название (body-sm → body), цена за штуку body-sm gray-600, тот же степпер gray-100 с Lucide minus/plus и целями 44px, но число в середине редактируемое (tabular-nums, при фокусе белая плитка с кольцом ink), сумма строки price ink. Удаление — иконка-кнопка 44px gray-600 с подложкой negative 8% при наведении.

### Buy Bar (телефон)
На странице товара закреплённая над вкладками белая полоса с ценой (price-md) и степпером/кнопкой шириной 11rem; видна только пока строка покупки в блоке справа вне экрана, выезжает за 300ms ease-out-quart и становится `inert`, когда строка видна.

### Bottom Sheet (фильтры на телефоне)
Нативный `<dialog>` снизу, высота до 85dvh, верхние углы 24px, затемнение 40%, въезд снизу за 300ms. Шапка «Фильтры» с крестиком 44px, прокручиваемые фильтры, внизу за линией кнопка 52px «Показать N товаров». Список за листом обновляется сразу. Закрывается фоном, Esc и крестиком.

## Do's and Don'ts

### Do:
- **Do** строить любой экран (витрина, корзина, оформление, кабинет, админка) на семантических ролях canvas, surface, ink, ink-hover, line, muted, positive, caution, negative и серой шкале.
- **Do** собирать формы из общих утилит `btn-*`, `field`, `field-label`, `field-hint`, `field-error`, `notice-*`, `link`, а не повторять классы по месту.
- **Do** начинать разрушительное действие с `btn-secondary` или `btn-text` с текстом negative и отдавать заливку `btn-danger` только финальному подтверждению.
- **Do** класть контент в белые карточки 16px на сером холсте, а элементы внутри скруглять на 12px.
- **Do** держать цели касания от 44px, а основную кнопку покупки — 52px.
- **Do** показывать фото товара на колодце gray-50 с `mix-blend-multiply`, чтобы белый фон снимка растворялся.
- **Do** подтверждать действие на месте: морф кнопки в степпер, толчок счётчика; 150–320ms, ease-out-quart.
- **Do** набирать цены пропорциональными цифрами, а `tabular-nums` ставить только на цифры, меняющиеся на месте.
- **Do** проверять reduced motion: глобально анимации и переходы схлопываются до 1ms, тосты появляются без движения.
- **Do** набирать текст ролями `text-<роль>` из `@theme` (headline, price, title, body, control, label, tab), а не сырыми кеглями с отдельным весом и трекингом.
- **Do** держать текст полей ввода 16px на телефоне и ставить неразрывный пробел между числом и единицей.

### Don't:
- **Don't** вводить хроматические шкалы помимо статусных ролей (`blue-*` и подобные): цвета, которого нет среди ролей, в разметке нет.
- **Don't** вкладывать в панель серые коробки с рамкой: разделы формы отделяет линия line, строки списка — плитки gray-50.
- **Don't** заливать чёрным что-либо, кроме действий и активного состояния; подвал остаётся светлым.
- **Don't** добавлять баннеры, карусели акций, ярлыки акций, бонусы и оранжевый цвет, даже следуя компоновке Ситилинка.
- **Don't** красить скидку в красный: скидка — чёрная плашка «−N%».
- **Don't** обозначать статус только цветом: точка всегда рядом со словом и числом.
- **Don't** обводить карточки рамкой и давать им тень в покое.
- **Don't** добавлять гамбургер-меню в шапку телефона: навигацию несут нижние вкладки.
- **Don't** вводить второй шрифт или системный шрифт для заголовков.
- **Don't** использовать жирный 700 (`font-bold`): потолок насыщенности — 600.
- **Don't** выделять активную вкладку сортировки или пункт фильтра прибавкой веса до 600.
- **Don't** ставить предзагрузку шрифта: измерено, на медленном 4G она замедляет первую отрисовку; скачок при подмене гасят метрические заменители.
- **Don't** использовать эмодзи вместо иконок: только Lucide.
