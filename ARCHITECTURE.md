# ARCHITECTURE — PRO-TUNING

## 1. Цели и ограничения

- **Работа целиком на GitHub**: SPA собирается в статику и деплоится на GitHub Pages без внешнего бэкенда (Vercel — опционально).
- **Бэкенд подключаем позже без переделки**: все данные — через контракты-провайдеры; сейчас mock (localStorage), затем Supabase-реализации тех же интерфейсов.
- Переключение провайдера: env `VITE_DATA_MODE=mock|supabase` (по умолчанию `mock`).

## 2. Слои

```
┌─────────────────────────────────────────────────────────┐
│ Pages (маршрутизация, оркестрация, только UI-состояние) │
├─────────────────────────────────────────────────────────┤
│ Features / Components (Calculator, Proposal, Matrix…)    │
├─────────────────────────────────────────────────────────┤
│ Hooks (TanStack Query) — подписка на данные, мутации    │
├─────────────────────────────────────────────────────────┤
│ Services — контракты-провайдеры + доменная логика       │
│   cars / services / prices / proposals / photos / auth   │
│   (каждый: интерфейс + mock-реализация [+ supabase-р] ) │
├─────────────────────────────────────────────────────────┤
│ lib (money, validation/zod, utils, config) · types       │
└─────────────────────────────────────────────────────────┘
```

Правила:
- Компоненты **не** содержат SQL/локальных запросов, расчётов и валидации.
- Бизнес-логика в `lib` и `services` (чистые функции, unit-тестируются).
- Хранение — только через провайдеров (никаких прямых обращений к localStorage в UI).
- Глобального state нет; локальное — React hooks; server state — TanStack Query.

## 3. Ключевые контракты

```ts
interface CarsProvider     { list(): Promise<Car[]>; create(data): Promise<Car>; update(id, data): Promise<Car>; remove(id): Promise<void> }
interface ServicesProvider { list(): Promise<Service[]>; create(data): Promise<Service>; update(id, data): Promise<Service>; remove(id): Promise<void> }
interface PricesProvider   { list(): Promise<Price[]>; upsert(carId, serviceId, price|null): Promise<void>; setMany(entries): Promise<void> }
interface ProposalsProvider{ list(): Promise<Proposal[]>; get(id): Promise<Proposal|null>; create(data): Promise<Proposal>; update(id, data): Promise<Proposal>; remove(id): Promise<void>; nextNumber(year): Promise<string> }
interface PhotosProvider   { upload(file): Promise<string>; remove(ref): Promise<void> }   // ref = картинка-строка (mock: dataURL; prod: storage url)
interface AuthProvider     { getSession(): Promise<Session|null>; login(email,pw): Promise<Session>; logout(): Promise<void>; }
```

## 4. Routed-карта

| Path | Страница | Доступ |
|---|---|---|
| `/login` | LoginPage | guest (redirect на `/calculator` при наличии сессии) |
| `/` | → redirect `/dashboard` | auth; для гостя → `/calculator` |
| `/calculator` | CalculatorPage | все (гость: без сохранения, печать/PDF/копирование) |
| `/dashboard` | DashboardPage | manager/admin |
| `/proposals` | ProposalsPage | manager/admin |
| `/proposals/:id` | ProposalViewPage | manager/admin |
| `/proposals/:id/print` | ProposalPrintPage | manager/admin |
| `/price-matrix` | PriceMatrixPage | manager/admin |
| `/cars` | CarsPage | manager/admin |
| `/services` | ServicesPage | admin |
| `/settings` | SettingsPage | admin |
| `*` | NotFound | auth |

Защита: `RequireAuth` (сессия) + `RequireRole(roles)` (роль из `profiles`). Гостевой уровень — это отсутствие сессии: `RequireRole` уводит гостя на `/login`.

## 5. Роли

| Действие | guest | manager | admin |
|---|---|---|---|
| Калькулятор: сборка, печать/PDF, копирование | ✔ | ✔ | ✔ |
| Просмотр дашборда/КП и сохранение КП | — | ✔ | ✔ |
| Автомобили и прайс-матрица (CRUD) | — | ✔ | ✔ |
| Услуги / настройки (CRUD) | — | — | ✔ |
| Export/Import backup | — | — | ✔ |
| Смена статуса КП | — | ✔ | ✔ |
| Управление ролями | — | — | +окружение Supabase |

## 6. Калькулятор и КП (business logic)

- Выбор услуг — локальный state страницы (`Set<serviceId>`).
- Доступные услуги = `price >= 0` для выбранного авто.
- `subtotal = Σ price`, `discount` (может быть ≤ subtotal, ≥ 0), `total = subtotal − discount`.
- При сохранении строится **snapshot** из `proposal_items`: копии `service_name` и `price` на момент сохранения.
- Номер КП `КП-YYYY-NNN` — через `nextNumber()`: max N по году + 1 (mock: счётчик в localStorage; prod: единственный DB-контракт).
- Деньги: **целые рубли** (`number`), формат через `lib/money.ts`. Ошибок округления нет (целочисленная арифметика).

## 7. Прайс-матрица

- Полная выборка cars+services+prices; матрица собирается клиентски.
- `null` цена = «—» (пустое поле).
- Правка цены: debounce ~400 мс + optimistic update + `upsert`.
- Sticky: первый столбец и header; горизонтальный scroll; на мобильных остаётся usable (не сжимаем).

## 8. Данные и фото (mock-слой)

- localStorage-ключи: `protuning_db_v1` (каталог+КП), `protuning_auth_v1` (сессия), `protuning_seed_v1` (флаг сидинга).
- Фото: canvas-сжатие до 1200×760 JPEG 0.82; в mock хранится dataURL (ограничение ~5 МБ, как в прототипе); в prod — Supabase Storage и `photo_url`.
- Попытка превысить квоту — понятная ошибка (toast), данные не теряются.

## 9. Auth (mock-этап)

- Seed-пользователи: `admin@protuning.ru` / `manager@protuning.ru` (пароль `demo1234`), роли из карты. Гость (без сессии) — только калькулятор.
- Сессия — в `localStorage`. Все UI-решения идентичны будущей Supabase-версии (единственный `AuthProvider`).
- Формы логина — zod; на странице — быстрые кнопки входа под роль (демо-режим).

## 10. PDF / печать

- Отдельный route `/proposals/:id/print` с собственным layout; `@media print` и `@page A4 (210×297mm)`.
- Из печати исключён UI приложения; «Печать/PDF» вызывает `window.print()`.
- Никаких pdf-движков в MVP (соответствует референсу, не ломает вёрстку).

## 11. Качество

- TypeScript strict; без `any` в продукте. zod — границы форм и импорта.
- ESLint flat + Prettier; Vitest (unit/integration) + Playwright (E2E, mock-режим).
- GitHub Actions: CI (lint+typecheck+unit+build) и deploy на GitHub Pages (workflow `deploy.yml`).

## 12. Будущий бэкенд (без переделки)

Добавляются `supabase/migrations/*.sql` и реализации `supabase*Provider`; в `services/module.ts` режим `VITE_DATA_MODE=supabase` переключает провайдеров. Структура БД зафиксирована в `DATA_MODEL.md`; UI, хуки и рост классов не меняются.