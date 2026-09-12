import { describe, expect, it } from 'vitest'
import { formatRub, parsePrice, sumPrices } from '@/lib/money'

describe('formatRub', () => {
  const NBSP = '\u00a0'

  it('форматирует числа с разделителями и символом рубля', () => {
    expect(formatRub(50000)).toBe(`50${NBSP}000 ₽`)
    expect(formatRub(0)).toBe('0 ₽')
    expect(formatRub(1234567)).toBe(`1${NBSP}234${NBSP}567 ₽`)
  })

  it('восстанавливается после null/undefined и отрицательных значений', () => {
    expect(formatRub(null)).toBe('0 ₽')
    expect(formatRub(undefined)).toBe('0 ₽')
    expect(formatRub(-5)).toBe('0 ₽')
    expect(formatRub(Number.NaN)).toBe('0 ₽')
  })

  it('отбрасывает дробную часть (целые рубли)', () => {
    expect(formatRub(1499.9)).toBe(`1${NBSP}499 ₽`)
  })
})

describe('parsePrice', () => {
  it('пустая и пробельная строка -> null', () => {
    expect(parsePrice('')).toBeNull()
    expect(parsePrice('   ')).toBeNull()
  })

  it('разбирает строки и убирает пробелы', () => {
    expect(parsePrice('15000')).toBe(15000)
    expect(parsePrice('15 000')).toBe(15000)
    expect(parsePrice('\u00a0150 000\u00a0')).toBe(150000)
  })

  it('возвращает null для не-чисел и отрицательных', () => {
    expect(parsePrice('abc')).toBeNull()
    expect(parsePrice('-100')).toBeNull()
  })

  it('приводит дробные к целым', () => {
    expect(parsePrice('12.75')).toBe(12)
  })
})

describe('sumPrices', () => {
  it('суммирует только положительные числа', () => {
    expect(sumPrices([100, 200, 300])).toBe(600)
    expect(sumPrices([100, -1, 0, null, undefined])).toBe(100)
  })

  it('пустой массив -> 0', () => {
    expect(sumPrices([])).toBe(0)
  })
})