import { beforeEach, describe, expect, it } from 'vitest'
import { mockCatalogImportProvider } from '@/services/mock-import'
import { mockCarsProvider } from '@/services/mock-cars'
import { mockPricesProvider } from '@/services/mock-prices'
import { loadDb } from '@/lib/mock/db'

beforeEach(() => {
  localStorage.clear()
})

describe('catalog import: автомобили', () => {
  it('добавляет новые и считает совпавшие', async () => {
    const before = loadDb().cars.length
    const report = await mockCatalogImportProvider.importCars([
      { brand: 'VOYAH', model: 'Dream' }, // уже есть в сиде
      { brand: 'CHERY', model: 'Tiggo' },
      { brand: 'CHERY', model: 'Tiggo' }, // дубль в этом же файле
    ])
    expect(report.carsMatched).toBe(2) // VOYAH из сида + дубль CHERY в этом же файле
    expect(report.carsCreated).toBe(1)
    expect((await mockCarsProvider.listAll()).length).toBe(before + 1)
  })

  it('совпадение по ключу не зависит от регистра и пробелов', async () => {
    const report = await mockCatalogImportProvider.importCars([{ brand: '  voyah ', model: '  Dream  ' }])
    expect(report.carsMatched).toBe(1)
    expect(report.carsCreated).toBe(0)
  })

  it('некорректные строки не меняют БД', async () => {
    const before = loadDb().cars.length
    const report = await mockCatalogImportProvider.importCars([{ brand: '', model: 'X' }])
    expect(report.invalid).toBe(1)
    expect(loadDb().cars.length).toBe(before)
  })
})

describe('catalog import: прайсы', () => {
  it('создаёт автомобиль, услугу и применяет цену', async () => {
    const report = await mockCatalogImportProvider.importPrices([
      { carKey: 'Geely Atlas', serviceKey: 'Новая услуга', price: 12345 },
    ])
    expect(report.carsCreated).toBe(1)
    expect(report.servicesCreated).toBe(1)
    expect(report.pricesApplied).toBe(1)

    const db = loadDb()
    const car = db.cars.find((c) => c.brand === 'Geely' && c.model === 'Atlas')
    const service = db.services.find((s) => s.name === 'Новая услуга')
    expect(car).toBeDefined()
    expect(service).toBeDefined()
    expect(db.prices.some((p) => p.carId === car!.id && p.serviceId === service!.id && p.price === 12345)).toBe(true)
  })

  it('обновляет существующую цену без дублей', async () => {
    const seeded = loadDb()
    const car = seeded.cars[0]!
    const service = seeded.services[0]!

    await mockCatalogImportProvider.importPrices([
      { carKey: `${car.brand} ${car.model}`, serviceKey: service.name, price: 777 },
    ])

    const db = loadDb()
    expect(db.cars.length).toBe(seeded.cars.length)
    expect(db.services.length).toBe(seeded.services.length)
    const pairs = db.prices.filter((p) => p.carId === car.id && p.serviceId === service.id)
    expect(pairs).toHaveLength(1)
    expect(pairs[0]!.price).toBe(777)
    expect((await mockPricesProvider.list()).some((p) => p.price === 777)).toBe(true)
  })

  it('существующие автомобиль и услуга не дублируются при повторном импорте', async () => {
    const rows = [{ carKey: 'Audi Q8', serviceKey: 'Свет', price: 1000 }]
    await mockCatalogImportProvider.importPrices(rows)
    const again = await mockCatalogImportProvider.importPrices(rows)
    expect(again.carsCreated).toBe(0)
    expect(again.servicesCreated).toBe(0)
    expect(again.pricesApplied).toBe(1)

    const db = loadDb()
    expect(db.cars.filter((c) => c.brand === 'Audi' && c.model === 'Q8')).toHaveLength(1)
    expect(db.services.filter((s) => s.name === 'Свет')).toHaveLength(1)
  })

  it('некорректная цена не меняет БД', async () => {
    const before = loadDb().cars.length
    const report = await mockCatalogImportProvider.importPrices([{ carKey: 'X9', serviceKey: 'Y', price: -5 }])
    expect(report.invalid).toBe(1)
    expect(loadDb().cars.length).toBe(before)
    expect(report.servicesCreated).toBe(0)
  })
})