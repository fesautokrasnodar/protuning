/** Нормализация телефонного номера: digits с приоритетом +7 и 8. */
export function phoneDigits(input: string): string {
  let d = input.replace(/\D/g, '')
  if (d.startsWith('8')) d = '7' + d.slice(1)
  if (d.startsWith('7')) d = d.slice(1)
  return d.slice(0, 10)
}

/** Форматирование по маске «+7 (XXX) XXX-XX-XX». Пустая строка -> ''. */
export function formatPhoneMask(input: string): string {
  const d = phoneDigits(input)
  if (d.length === 0) return ''
  let out = `+7 (${d.slice(0, 3)}`
  if (d.length >= 4) out += `) ${d.slice(3, 6)}`
  if (d.length >= 7) out += `-${d.slice(6, 8)}`
  if (d.length >= 9) out += `-${d.slice(8, 10)}`
  return out
}

/** Полный номер в каноническом виде «+7XXXXXXXXXX» или null (неполный). */
export function parsePhone(input: string): string | null {
  const d = phoneDigits(input)
  if (d.length < 10) return null
  return `+7${d}`
}