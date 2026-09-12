import { describe, expect, it } from 'vitest'
import {
  availableServicesForCar,
  buildSnapshotItems,
  clampDiscount,
  computeTotals,
  priceForCar,
  carLabel,
} from '@/lib/calc'
import type { Car, Price, Service } from '@/types'

const services: Service[] = [
  { id: 's1', name: 'Шумоизоляция дверей', isActive: true, createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z' },
  { id: 's2', name: 'Шумоизоляция пола', isActive: true, createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z' },
  { id: 's3', name: 'Услуга без цены', isActive: true, createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z' },
]

const prices: Price[] = [
  { id: 'p1', carId: 'car1', serviceId: 's1', price: 15000, createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z' },
  { id: 'p2', carId: 'car1', serviceId: 's2', price: 20000, createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z' },
  { id: 'p3', carId: 'car2', serviceId: 's1', price: 16000, createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z' },
]

describe('clampDiscount', () => {
  it('ограничивает диапазоном [0, subtotal]', () => {
    expect(clampDiscount(500, 1000)).toBe(500)
    expect(clampDiscount(-10, 1000)).toBe(0)
    expect(clampDiscount(5000, 1000)).toBe(1000)
  })

  it('приводит дробные значения к целым', () => {
    expect(clampDiscount(100.7, 1000)).toBe(100)
  })

  it('не-число -> 0', () => {
    expect(clampDiscount(Number.NaN, 1000)).toBe(0)
  })
})

describe('computeTotals', () => {
  it('total = subtotal - discount', () => {
    expect(computeTotals([15000, 20000], 5000)).toEqual({ subtotal: 35000, discount: 5000, total: 30000 })
  })

  it('скидка не может превысить subtotal', () => {
    expect(computeTotals([10000], 99999)).toEqual({ subtotal: 10000, discount: 10000, total: 0 })
  })
})

describe('availableServicesForCar / priceForCar', () => {
  it('возвращает только услуги с ценой для конкретной модели', () => {
    expect(availableServicesForCar(services, prices, 'car1').map((s) => s.id)).toEqual(['s1', 's2'])
    expect(availableServicesForCar(services, prices, 'car3')).toEqual([])
  })

  it('ищет цену по паре carId+serviceId', () => {
    expect(priceForCar(prices, 'car1', 's1')).toBe(15000)
    expect(priceForCar(prices, 'car2', 's1')).toBe(16000)
    expect(priceForCar(prices, 'car1', 's3')).toBeNull()
  })
})

describe('buildSnapshotItems', () => {
  it('фиксирует имя и цену в момент сохранения', () => {
    const items = buildSnapshotItems('prop1', [
      { serviceId: 's1', serviceName: 'Старое имя', price: 100 },
      { serviceId: 's2', serviceName: 'Шумоизоляция пола', price: 200 },
    ])
    expect(items).toHaveLength(2)
    expect(items[0]?.serviceName).toBe('Старое имя')
    expect(items[0]?.price).toBe(100)
    expect(items[0]?.quantity).toBe(1)
    expect(items[0]?.total).toBe(100)
    expect(items[1]?.proposalId).toBe('prop1')
  })
})

describe('carLabel', () => {
  it('формирует бренд + модель', () => {
    const car: Car = { id: 'c1', brand: 'VOYAH', model: 'Dream', photoUrl: null, isActive: true, createdAt: '', updatedAt: '' }
    expect(carLabel(car)).toBe('VOYAH Dream')
    expect(carLabel(null)).toBe('—')
  })
})