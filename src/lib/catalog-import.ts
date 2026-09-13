/**
 * Разбор CSV-файлов для импорта автомобилей и прайсов в «Настройках».
 * Формат: UTF-8 (поддерживается BOM), разделитель `;` / `,` / таб (автодетект),
 * quoted-поля `"…"`, CRLF. Цены — целое неотрицательное число, разрешены пробелы-разделители тысяч.
 */

export interface CarImportRow {
  brand: string
  model: string
}

export interface PriceImportRow {
  carKey: string
  serviceKey: string
  price: number
}

export interface ParsedImport<T> {
  rows: T[]
  /** Ошибки строк вида «строка N: причина» (первая часть всегда есть). */
  errors: string[]
}

const MAX_CAR_FIELD = 60
const MAX_SERVICE_NAME = 120
const MAX_PRICE = 100_000_000

/** Нормализованный ключ для сопоставления: trim + схлопывание пробелов + lower-case. */
export function normalizeKey(value: string): string {
  return value.trim().replace(/\s+/g, ' ').toLowerCase()
}

function detectDelimiter(lines: string[]): string {
  const candidates = [';', ',', '\t']
  let best = ';'
  let bestCount = -1
  for (const d of candidates) {
    let count = 0
    for (const line of lines.slice(0, 3)) count += line.split(d).length - 1
    if (count > bestCount) {
      bestCount = count
      best = d
    }
  }
  return best
}

/** Разобрать одну строку CSV с учётом кавычек `"…"` и дублирующихся `""`. */
function parseLine(line: string, delimiter: string): string[] {
  const out: string[] = []
  let cur = ''
  let inQuotes = false
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (inQuotes) {
      if (ch === '"') {
        if (line[i + 1] === '"') {
          cur += '"'
          i++
        } else {
          inQuotes = false
        }
      } else {
        cur += ch
      }
    } else if (ch === '"') {
      inQuotes = true
    } else if (ch === delimiter) {
      out.push(cur.trim())
      cur = ''
    } else {
      cur += ch
    }
  }
  out.push(cur.trim())
  return out
}

/** Строки CSV (только непустые), без BOM и CR. */
export function parseCsv(text: string): string[][] {
  const cleaned = text.replace(/^\uFEFF/, '').replace(/\r\n?/g, '\n')
  const lines = cleaned.split('\n').filter((l) => l.trim() !== '')
  if (lines.length === 0) return []
  const delimiter = detectDelimiter(lines)
  return lines.map((l) => parseLine(l, delimiter))
}

/* ---------- Автомобили ---------- */

function isCarsHeader(cells: string[]): boolean {
  const k = cells.map((c) => normalizeKey(c))
  return k.some((c) => c === 'марка' || c === 'бренд' || c === 'модель' || c === 'автомобиль' || c === 'model')
}

/** Разобрать файл автомобилей: `Марка;Модель` (заголовок опционален). */
export function parseCarsCsv(text: string): ParsedImport<CarImportRow> {
  const cells = parseCsv(text)
  const rows: CarImportRow[] = []
  const errors: string[] = []
  for (let i = 0; i < cells.length; i++) {
    const row = cells[i]
    if (i === 0 && isCarsHeader(row)) continue
    const line = i + 1
    const brand = (row[0] ?? '').trim()
    const model = (row[1] ?? '').trim()
    if (!brand) {
      errors.push(`строка ${line}: не указана марка`)
      continue
    }
    if (!model) {
      errors.push(`строка ${line}: не указана модель`)
      continue
    }
    if (brand.length > MAX_CAR_FIELD || model.length > MAX_CAR_FIELD) {
      errors.push(`строка ${line}: марка или модель длиннее ${MAX_CAR_FIELD} символов`)
      continue
    }
    rows.push({ brand, model })
  }
  return { rows, errors }
}

/* ---------- Прайсы ---------- */

function isPricesHeader(cells: string[]): boolean {
  const k = cells.map((c) => normalizeKey(c))
  if (k.length < 3) return false
  const first = k[0]
  const last = k[k.length - 1]
  const isCar = first === 'автомобиль' || first === 'марка' || first === 'машина'
  const isPrice = last === 'цена' || last === 'стоимость' || last === 'сумма' || last === 'price'
  const isService = k[1] === 'услуга' || k[1] === 'сервис' || k[1] === 'работа'
  return isCar && (isService || isPrice)
}

/** Разобрать цену: целое ≥ 0, допускаются пробелы-разделители тысяч. Пустая → null (нет цены). */
function parsePriceCell(raw: string): number | null {
  const cleaned = raw.replace(/[\s\u00a0\u202f]/g, '')
  if (cleaned === '') return null
  const n = Number(cleaned)
  if (!Number.isFinite(n) || !Number.isInteger(n) || n < 0) return null
  return n
}

/** Разобрать файл прайсов: `Автомобиль;Услуга;Цена` (заголовок опционален). */
export function parsePricesCsv(text: string): ParsedImport<PriceImportRow> {
  const cells = parseCsv(text)
  const rows: PriceImportRow[] = []
  const errors: string[] = []
  for (let i = 0; i < cells.length; i++) {
    const row = cells[i]
    if (i === 0 && isPricesHeader(row)) continue
    const line = i + 1
    const carKey = (row[0] ?? '').trim()
    const serviceKey = (row[1] ?? '').trim()
    if (!carKey) {
      errors.push(`строка ${line}: не указан автомобиль`)
      continue
    }
    if (carKey.length > 120) {
      errors.push(`строка ${line}: название автомобиля длиннее 120 символов`)
      continue
    }
    if (!serviceKey) {
      errors.push(`строка ${line}: не указана услуга`)
      continue
    }
    if (serviceKey.length > MAX_SERVICE_NAME) {
      errors.push(`строка ${line}: название услуги длиннее ${MAX_SERVICE_NAME} символов`)
      continue
    }
    const price = parsePriceCell(row[2] ?? '')
    if (price === null) {
      errors.push(`строка ${line}: некорректная цена — укажите целое число`)
      continue
    }
    if (price > MAX_PRICE) {
      errors.push(`строка ${line}: цена больше ${MAX_PRICE.toLocaleString('ru-RU')}`)
      continue
    }
    rows.push({ carKey, serviceKey, price })
  }
  return { rows, errors }
}

/* ---------- Построение CSV (файлы-примеры) ---------- */

/** Экранировать поле: кавычки/разделители/переносы оборачиваются в `"…"`, `"` дублируется. */
function escapeCell(value: string, delimiter: string): string {
  if (value.includes('"') || value.includes('\n') || value.includes('\r') || value.includes(delimiter)) {
    return `"${value.replace(/"/g, '""')}"`
  }
  return value
}

function toCsv(headers: string[], rows: string[][], delimiter: string): string {
  const lines = [headers.map((h) => escapeCell(h, delimiter)).join(delimiter)]
  for (const row of rows) lines.push(row.map((cell) => escapeCell(cell, delimiter)).join(delimiter))
  return `\uFEFF${lines.join('\r\n')}`
}

/** Построить пример файла автомобилей: BOM + заголовок `Марка;Модель`. */
export function buildCarsCsv(rows: CarImportRow[]): string {
  return toCsv(
    ['Марка', 'Модель'],
    rows.map((r) => [r.brand, r.model]),
    ';',
  )
}

/** Построить пример файла прайсов: BOM + заголовок `Автомобиль;Услуга;Цена`. */
export function buildPricesCsv(rows: PriceImportRow[]): string {
  return toCsv(
    ['Автомобиль', 'Услуга', 'Цена'],
    rows.map((r) => [r.carKey, r.serviceKey, String(r.price).replace(/\B(?=(\d{3})+(?!\d))/g, ' ')]),
    ';',
  )
}