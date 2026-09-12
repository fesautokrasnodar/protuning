# IMPLEMENTATION_PLAN — PRO-TUNING

Статус: MVP на mock-данных, деплой на GitHub Pages. Бэкенд (Supabase) — следующий этап, без переделки.

## Phase 0 — Audit ✅ (выполнено)
`PROJECT_ANALYSIS.md`, `ARCHITECTURE.md`, `DATA_MODEL.md`, legacy → `legacy/`, логотип → `public/logo.png`.

## Phase 1 — Bootstrap
- Vite + React 19 + TS strict, Tailwind CSS v4 (плагин `@tailwindcss/vite`), shadcn-подобный UI, ESLint flat + Prettier, Vitest + Testing Library, Playwright.
- Path alias `@/*`; `base: './'`; HashRouter (работает на GitHub Pages под путём репозитория).
- Конфиги: `eslint.config.js`, `.prettierrc`, `.gitignore`, `.env.example`.

**Проверка:** `npm run typecheck`, `npm run build`.

## Phase 2 — Домен
- `types/`: Car, Service, Price, Proposal, ProposalItem, Profile, Role, ProposalStatus, Session.
- `lib/money.ts` (toPrice/format), `lib/validation/schemas.ts` (zod).
**Проверка:** unit-тесты money/schemas.

## Phase 3 — Mock-слой данных
- `lib/mock/db.ts` (localStorage, subscribe, инварианты), `seed.ts`.
- Провайдеры + `services/module.ts` (выбор по `VITE_DATA_MODE`).
- TanStack Query хуки: cars/services/prices/proposals/mutation-хуки.

## Phase 4 — Auth + маршрутизация + UI-база
- Mock-auth (session, users, roles), `RequireAuth`, `RequireRole`.
- UI-компоненты (button, input, dialog, alert-dialog, select, dropdown, table, badge, tabs, skeleton, sonner, separator, tooltip), layout (topbar + nav + user menu).

## Phase 5 — Функциональные страницы
- Dashboard, Calculator (car picker, клиент/контакт, услуги+цены, select all/clear, total, скидка).
- Proposal preview (стиль прототипа), сохранение со snapshot, список КП (поиск/статус/сортировка), просмотр/копирование/удаление/статусы, print-страница.
**Проверка:** логика тоталов и snapshot unit-тестами; ручной E2E-сценарий.

## Phase 6 — Прайс-матрица, Cars, Services
- Matrix: sticky first column + header, горизонтальный scroll, debounce-правка цен, optimistic UI, `null` → «—».
- Cars: CRUD + фото (compress→upload→ref). Services: CRUD.

## Phase 7 — Settings
- Export JSON (cars/services/prices), Import с zod-валидацией → сводка → подтверждение → apply.

## Phase 8 — Тесты и качество
- Unit: money, totals/discount, snapshot, доступность услуг, схемы.
- Integration: mock-провайдеры (CRUD cars/services/prices, proposals).
- E2E (Playwright): login → car → services → client → save → open → print.
- Прогон: `npm run lint`, `npm run typecheck`, `npm test`, `npm run build`; фиксы.

## Phase 9 — GitHub Pages + документация
- `.github/workflows/ci.yml` (lint+typecheck+test+build), `.github/workflows/deploy.yml` (Pages).
- README, DECISIONS. Инструкция включения GitHub Pages (Settings → Pages → Actions).

## Версионные контрольные вехи
1. docs: анализ и план
2. chore: bootstrap
3. feat: домен + mock-слой + auth
4. feat: dashboard/calculator/proposals/print
5. feat: matrix/cars/services
6. feat: settings + backup
7. test: unit/integration/e2e + фиксы
8. chore: gh-pages, ci, readme