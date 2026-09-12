# PRO-TUNING · Калькулятор стоимости тюнинга

Веб-приложение для расчёта и выпуска коммерческих предложений (КП) по тюнингу и
дооснащению автомобилей: прайс-матрица, калькулятор с предпросмотром A4,
архив КП со сменой статусов, печать/Save-as-PDF, справочники и резервное
копирование.

Проект перенесён из HTML-прототипа (`legacy/`) и собран на `React + Vite + TS`.
Первый этап работает полностью в браузере (данные в `localStorage`) и
разворачивается на **GitHub Pages** без бэкенда. Второй этап — перенос данных на
Supabase через слой контрактов `src/services/`.

## Демо

Рабочую версию можно поднять локально (`npm run dev`) или открыть на GitHub
Pages репозитория (URL появится в `Settings → Pages` после пуша в `main`).

Демо-аккаунты (пароль у всех `demo1234`). Вход не обязателен — гостевой доступ открывает калькулятор (сборка КП + печать/PDF/копирование без сохранения в архиве):

| Роль            | E-mail                 | Возможности                                              |
| --------------- | ---------------------- | -------------------------------------------------------- |
| Администратор   | admin@protuning.ru     | всё: калькулятор, КП, цены, справочники, настройки, бэкап |
| Менеджер        | manager@protuning.ru   | дашборд, калькулятор, КП, автомобили, прайс-матрица       |

## Быстрый старт

```bash
# 1) зависимости
npm ci

# 2) режим данных (по умолчанию mock — без .env)
cp .env.example .env   # необязательно; VITE_DATA_MODE=mock

# 3) разработка
npm run dev            # http://localhost:5173

# 4) продакшен-сборка и локальный предпросмотр
npm run build
npm run preview        # http://localhost:4173
```

## Скрипты

| Команда            | Что делает                                             |
| ------------------ | ------------------------------------------------------ |
| `npm run dev`      | дев-сервер Vite                                        |
| `npm run build`    | продакшен-сборка в `dist/`                             |
| `npm run preview`  | предпросмотр собранного приложения                     |
| `npm run typecheck`| проверка типов `tsc` (app + node)                      |
| `npm run lint`     | ESLint Flat Config                                     |
| `npm run test`     | unit-тесты Vitest + jsdom                               |
| `npm run e2e`      | сквозные тесты Playwright (chromium)                   |

## Структура

```
src/
  app/            провайдеры (Query, Auth), гарды, лэйаут, роутер
  components/
    ui/           UI-кит (shadcn-стиль: button, dialog, select, table…)
    common/       общестраничные блоки (пусто/ошибка/заголовки)
    calculator/   блоки калькулятора
    proposal/     A4-документ КП (превью и печать)
  hooks/          react-query обёртки над контрактами услуг
  lib/
    money.ts      форматирование рублей, парсинг цен
    calc.ts       скидки, итоги, доступные услуги, snapshot
    validation/   zod-схемы входных форм и бэкапа
    mock/         localStorage-БД, seed, хэш паролей (WebCrypto)
    proposal-view.ts, proposal-meta.ts   представление КП
  pages/          страницы приложения
  services/       контракты провайдеров + mock-реализации
  test/           setup для Vitest
e2e/              Playwright-сценарии
legacy/           исходный HTML-прототип (референс)
```

## Доменные правила

- Деньги — **целые рубли**, без копеек.
- КП хранит **snapshot**: название услуги и цена фиксируются в момент сохранения
  и не зависят от последующих правок справочников.
- Нумерация КП: `КП-YYYY-NNN`, номера не переиспользуются после удаления.
- Скидка ограничена диапазоном `[0, стоимость услуг]`.
- Удаление автомобиля, упомянутого в КП, запрещено (`DomainError IN_USE`).
- Печать/PDF: A4 с нулевыми полями, документ 794×1123 px (= 210×297 мм).

## Режим данных

Контракты в `src/services/module.ts` определяют единый набор методов
(`CarsProvider`, `ServicesProvider`, `PricesProvider`, `ProposalsProvider` …).
Сейчас активен `mock` (localStorage). Переход на Supabase — это реализация тех же
контрактов и установка `VITE_DATA_MODE=supabase`; интерфейс не меняется.
Ключи хранилища: `protuning_db_v1`, `protuning_auth_v1`.

## Тесты и проверки перед пушем

```bash
npm run lint && npm run typecheck && npm test && npm run build
```

CI (`.github/workflows/ci.yml`) прогоняет эти шаги и e2e на каждый push/PR.
Деплой на GitHub Pages — `.github/workflows/deploy.yml` (нужно включить
Source = GitHub Actions в настройках Pages).

## Документация решения

- `docs/ARCHITECTURE.md` — слои, карта маршрутов, стратегия данных
- `docs/DATA_MODEL.md` — сущности и связи
- `docs/DECISIONS.md` — зафиксированные D1…D12
- `docs/IMPLEMENTATION_PLAN.md` — чек-лист этапов
- `docs/PROJECT_ANALYSIS.md` — анализ HTML-прототипа

## Команда (минимально)

```bash
git add .
git commit -m "feat: app ready for GitHub Pages (mock stage)"
git push
```