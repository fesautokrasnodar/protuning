import { describe, expect, it } from 'vitest'
import { normalizeKey, parseCarsCsv, parsePricesCsv } from '@/lib/catalog-import'

describe('normalizeKey', () => {
  it('схлопывает пробелы и приводит к нижнему регистру', () => {
    expect(normalizeKey('  VOYAH   Dream ')).toBe('voyah dream')
  })
})

describe('parseCarsCsv', () => {
  it('разбирает строки «Марка;Модель» без заголовка', () => {
    const { rows, errors } = parseCarsCsv('VOYAH;Dream\nTANK;500')
    expect(errors).toEqual([])
    expect(rows).toEqual([
      { brand: 'VOYAH', model: 'Dream' },
      { brand: 'TANK', model: '500' },
    ])
  })

  it('пропускает заголовок «Марка;Модель»', () => {
    const { rows } = parseCarsCsv('Марка;Модель\nLADA;Granta')
    expect(rows).toEqual([{ brand: 'LADA', model: 'Granta' }])
  })

  it('определяет разделитель-запятую', () => {
    const { rows } = parseCarsCsv('Audi,Q7\nBMW,X5')
    expect(rows).toHaveLength(2)
    expect(rows[0]).toEqual({ brand: 'Audi', model: 'Q7' })
  })

  it('разбирает таб и BOM UTF-8', () => {
    const { rows } = parseCarsCsv('\uFEFFMazda\tCX-5')
    expect(rows[0]).toEqual({ brand: 'Mazda', model: 'CX-5' })
  })

  it('разбирает CRLF', () => {
    const { rows } = parseCarsCsv('Honda;Civic\r\nToyota;Corolla')
    expect(rows).toHaveLength(2)
  })

  it('quoted-поле с разделителем остаётся одной ячейкой', () => {
    const { rows } = parseCarsCsv('"RANGE;ROVER";Evoque')
    expect(rows).toEqual([{ brand: 'RANGE;ROVER', model: 'Evoque' }])
  })

  it('собирает ошибки строк с номерами', () => {
    const { rows, errors } = parseCarsCsv(';Dream\nTANK;\nVOYAH;Dream')
    expect(rows).toHaveLength(1)
    expect(errors).toHaveLength(2)
    expect(errors[0]).toMatch(/строка 1: не указана марка/)
    expect(errors[1]).toMatch(/строка 2: не указана модель/)
  })

  it('режет слишком длинные поля', () => {
    const { rows, errors } = parseCarsCsv(`${'A'.repeat(70)};M`)
    expect(rows).toHaveLength(0)
    expect(errors[0]).toMatch(/строка 1/)
  })

  it('пустой текст не даёт строк', () => {
    expect(parseCarsCsv('')).toEqual({ rows: [], errors: [] })
  })
})

describe('parsePricesCsv', () => {
  it('разбирает строки «Автомобиль;Услуга;Цена»', () => {
    const { rows, errors } = parsePricesCsv('VOYAH Dream;Замена света;45 000')
    expect(errors).toEqual([])
    expect(rows).toEqual([{ carKey: 'VOYAH Dream', serviceKey: 'Замена света', price: 45000 }])
  })

  it('пропускает заголовок «Автомобиль;Услуга;Цена»', () => {
    const { rows } = parsePricesCsv('Автомобиль;Услуга;Цена\nTANK 500;Тонировка;26 000')
    expect(rows).toHaveLength(1)
    expect(rows[0]!.price).toBe(26000)
  })

  it('пустая цена — ошибка строки', () => {
    const { rows, errors } = parsePricesCsv('VOYAH Dream;Замена света;')
    expect(rows).toHaveLength(0)
    expect(errors[0]).toMatch(/строка 1: некорректная цена/)
  })

  it('нецелая цена — ошибка строки', () => {
    const { errors } = parsePricesCsv('VOYAH Dream;Свет;1.5')
    expect(errors[0]).toMatch(/некорректная цена/)
  })

  it('отрицательная цена не проходит', () => {
    const { rows } = parsePricesCsv('VOYAH Dream;Свет;-5')
    expect(rows).toHaveLength(0)
  })

  it('пропускает неполные строки', () => {
    const { rows, errors } = parsePricesCsv('VOYAH Dream;Свет;1000\nВообще без данных')
    expect(rows).toHaveLength(1)
    expect(errors).toHaveLength(1)
    expect(errors[0]).toMatch(/не указана услуга/)
  })
})