import type { Car, ImportReport, Service, CatalogImportProvider } from '@/services/module'
import { commitDb, loadDb, nowIso, uid } from '@/lib/mock/db'
import { normalizeKey } from '@/lib/catalog-import'

function carKeyOf(car: Car): string {
  return normalizeKey(`${car.brand} ${car.model}`)
}

function splitCarKey(value: string): { brand: string; model: string } {
  const cleaned = value.trim().replace(/\s+/g, ' ')
  const idx = cleaned.indexOf(' ')
  if (idx === -1) return { brand: cleaned, model: cleaned }
  return { brand: cleaned.slice(0, idx), model: cleaned.slice(idx + 1).trim() }
}

const emptyReport = (): ImportReport => ({
  carsCreated: 0,
  carsMatched: 0,
  servicesCreated: 0,
  pricesApplied: 0,
  invalid: 0,
  errors: [],
})

export const mockCatalogImportProvider: CatalogImportProvider = {
  async importCars(rows) {
    const db = loadDb()
    const report = emptyReport()
    const byKey = new Map<string, Car>(db.cars.map((c) => [carKeyOf(c), c]))

    for (const row of rows) {
      const brand = row.brand.trim()
      const model = row.model.trim()
      if (!brand || !model) {
        report.invalid++
        report.errors.push('строка без марки или модели пропущена')
        continue
      }
      const key = normalizeKey(`${brand} ${model}`)
      if (byKey.has(key)) {
        report.carsMatched++
        continue
      }
      const t = nowIso()
      const car: Car = {
        id: uid('car'),
        brand,
        model,
        photoUrl: null,
        isActive: true,
        createdAt: t,
        updatedAt: t,
      }
      byKey.set(key, car)
      db.cars.push(car)
      report.carsCreated++
    }

    if (report.carsCreated > 0 || report.invalid > 0) commitDb(db)
    return report
  },

  async importPrices(rows) {
    const db = loadDb()
    const report = emptyReport()
    const carsByKey = new Map<string, Car>(db.cars.map((c) => [carKeyOf(c), c]))
    const servicesByKey = new Map<string, Service>(db.services.map((s) => [normalizeKey(s.name), s]))
    const priceByKey = new Map(db.prices.map((p) => [`${p.carId}:${p.serviceId}`, p]))

    for (const row of rows) {
      const carKey = normalizeKey(row.carKey)
      const serviceKey = normalizeKey(row.serviceKey)
      if (!carKey || !serviceKey) {
        report.invalid++
        report.errors.push('строка без автомобиля или услуги пропущена')
        continue
      }
      if (!Number.isInteger(row.price) || row.price < 0) {
        report.invalid++
        report.errors.push(`некорректная цена для «${row.carKey} / ${row.serviceKey}»`)
        continue
      }

      let car = carsByKey.get(carKey)
      if (!car) {
        const split = splitCarKey(row.carKey)
        const t = nowIso()
        car = {
          id: uid('car'),
          brand: split.brand,
          model: split.model,
          photoUrl: null,
          isActive: true,
          createdAt: t,
          updatedAt: t,
        }
        carsByKey.set(carKey, car)
        db.cars.push(car)
        report.carsCreated++
      }

      let service = servicesByKey.get(serviceKey)
      if (!service) {
        const t = nowIso()
        service = {
          id: uid('srv'),
          name: row.serviceKey.trim(),
          isActive: true,
          createdAt: t,
          updatedAt: t,
        }
        servicesByKey.set(serviceKey, service)
        db.services.push(service)
        report.servicesCreated++
      }

      const key = `${car.id}:${service.id}`
      const t = nowIso()
      const existing = priceByKey.get(key)
      if (existing) {
        existing.price = row.price
        existing.updatedAt = t
      } else {
        const price = { id: uid('price'), carId: car.id, serviceId: service.id, price: row.price, createdAt: t, updatedAt: t }
        priceByKey.set(key, price)
        db.prices.push(price)
      }
      report.pricesApplied++
    }

    if (report.carsCreated > 0 || report.servicesCreated > 0 || report.pricesApplied > 0 || report.invalid > 0) {
      commitDb(db)
    }
    return report
  },
}