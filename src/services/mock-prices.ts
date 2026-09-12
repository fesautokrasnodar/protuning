import type { PriceUpsertInput } from '@/lib/validation/schemas'
import type { PricesProvider } from '@/services/module'
import { commitDb, loadDb, nowIso, uid } from '@/lib/mock/db'

function updatePriceInDb(carId: string, serviceId: string, price: number | null): void {
  const db = loadDb()
  const existing = db.prices.find((p) => p.carId === carId && p.serviceId === serviceId)
  if (existing) {
    existing.price = price
    existing.updatedAt = nowIso()
  } else {
    const t = nowIso()
    db.prices.push({
      id: uid('price'),
      carId,
      serviceId,
      price,
      createdAt: t,
      updatedAt: t,
    })
  }
  commitDb(db)
}

export const mockPricesProvider: PricesProvider = {
  async list() {
    return loadDb().prices
  },
  async upsert(input: PriceUpsertInput) {
    updatePriceInDb(input.carId, input.serviceId, input.price)
  },
  async setMany(entries) {
    for (const e of entries) {
      updatePriceInDb(e.carId, e.serviceId, e.price)
    }
  },
}