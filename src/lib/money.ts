const rubFormatter = new Intl.NumberFormat('ru-RU')

/** Отформатировать число как рубли: «50 000 ₽» */
export function formatRub(value: number | null | undefined): string {
  const n = Number(value ?? 0)
  if (!Number.isFinite(n)) return '0 ₽'
  return `${rubFormatter.format(Math.trunc(Math.max(0, n)))} ₽`
}

/**
 * Строго разобрать цену из строки ввода.
 * Пустая строка -> null («цена не задана»). Не-число -> null.
 * Возвращает целое неотрицательное число или null.
 */
export function parsePrice(input: string): number | null {
  const trimmed = input.trim().replace(/\s+/g, '')
  if (trimmed === '') return null
  const n = Number(trimmed)
  if (!Number.isFinite(n)) return null
  const int = Math.trunc(n)
  if (int < 0) return null
  return int
}

/** Сумма цен (целые рубли). При любых целых аргументах результат целый и точен. */
export function sumPrices(prices: (number | null | undefined)[]): number {
  let acc = 0
  for (const p of prices) {
    const v = Number(p ?? 0)
    if (Number.isFinite(v) && v > 0) acc += v
  }
  return acc
}