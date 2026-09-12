# DATA_MODEL — PRO-TUNING

Целевая модель (PostgreSQL-совместимая). На mock-этапе реализуется в localStorage с теми же контрактами. Значения денег — **целые рубли** (`integer`).

## profiles

| колонка | тип | примечание |
|---|---|---|
| id | uuid pk | = auth.users.id (на этапе Supabase) |
| user_id | uuid | связан с auth |
| full_name | text | |
| role | text | `admin` \| `manager` \| `viewer` |
| created_at | timestamptz | |
| updated_at | timestamptz | |

## cars

| колонка | тип | примечание |
|---|---|---|
| id | uuid pk | |
| brand | text | zod: 1..60 |
| model | text | zod: 1..60 |
| photo_url | text | NULL | ссылка на Storage / dataURL (mock) |
| is_active | boolean | def true |
| created_at | timestamptz | |
| updated_at | timestamptz | |

## services

| колонка | тип | примечание |
|---|---|---|
| id | uuid pk | |
| name | text | zod: 1..120 |
| is_active | boolean | def true |
| created_at | timestamptz | |
| updated_at | timestamptz | |

## prices

| колонка | тип | примечание |
|---|---|---|
| id | uuid pk | |
| car_id | uuid fk→cars | |
| service_id | uuid fk→services | |
| price | integer | **NULL** = услуга не предлагается; ≥ 0 |
| created_at | timestamptz | |
| updated_at | timestamptz | |
| **unique(car_id, service_id)** | | одна цена на пару |

## proposals

| колонка | тип | примечание |
|---|---|---|
| id | uuid pk | |
| number | text | `КП-YYYY-NNN` (unique) |
| car_id | uuid fk→cars | |
| client_name | text | |
| client_contact | text | |
| status | text | `draft` \| `sent` \| `approved` \| `rejected` \| `archived` |
| subtotal | integer | Σ цен услуг (snapshot) |
| discount | integer | ≥ 0, ≤ subtotal |
| total | integer | subtotal − discount |
| created_by | uuid | |
| created_at | timestamptz | |
| updated_at | timestamptz | |

## proposal_items (snapshot)

| колонка | тип | примечание |
|---|---|---|
| id | uuid pk | |
| proposal_id | uuid fk→proposals (on delete cascade) | |
| service_id | uuid | референс (может быть удалён позже) |
| service_name | text | **snapshot названия** |
| price | integer | **snapshot цены** |
| quantity | integer | def 1 |
| total | integer | price × quantity |

> Ключевое правило: цены и названия в КП фиксируются на момент сохранения и **не меняются** при изменении прайс-матрицы.

## price_history (архитектура для следующего этапа)

| колонка | тип | примечание |
|---|---|---|
| id | uuid pk | |
| car_id | uuid | |
| service_id | uuid | |
| old_price | integer \| null | |
| new_price | integer \| null | |
| changed_by | uuid | |
| created_at | timestamptz | |

На mock-этапе не пишется; структура зафиксирована, в Supabase добавится trigger без изменения приложения.

## Mock-представление (localStorage `protuning_db_v1`)

```ts
{
  version: 1,
  cars: Car[],
  services: Service[],
  prices: Price[],
  proposals: Proposal[]         // each with items: ProposalItem[]
  counters: { [year: number]: number }
}
```

## Индексы (для будущего DDL)

- `prices (car_id)`, `prices (service_id)`, unique `(car_id, service_id)`;
- `proposal_items (proposal_id)`;
- `proposals (number)` unique, `proposals (created_by)`, `proposals (status)`, `proposals (created_at desc)`.

## Контракт экспорта/импорта (backup)

```ts
interface BackupV1 {
  version: 1
  exported_at: string
  cars: Car[]
  services: Service[]
  prices: Price[]
}
```

Zod-схема валидирует структуру; импорт идёт только после подтверждения пользователем.