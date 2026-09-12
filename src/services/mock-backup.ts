import type { BackupV1 } from '@/lib/validation/schemas'
import type { BackupProvider } from '@/services/module'
import { commitDb, loadDb, nowIso } from '@/lib/mock/db'

export const mockBackupProvider: BackupProvider = {
  async exportCatalog() {
    const db = loadDb()
    return {
      version: 1,
      exportedAt: nowIso(),
      cars: db.cars.map((c) => ({
        id: c.id,
        brand: c.brand,
        model: c.model,
        photoUrl: c.photoUrl,
        isActive: c.isActive,
      })),
      services: db.services.map((s) => ({
        id: s.id,
        name: s.name,
        isActive: s.isActive,
      })),
      prices: db.prices.map((p) => ({
        id: p.id,
        carId: p.carId,
        serviceId: p.serviceId,
        price: p.price,
      })),
    }
  },
  async importCatalog(data: BackupV1) {
    const db = loadDb()
    db.cars = data.cars.map((c) => ({
      id: c.id,
      brand: c.brand,
      model: c.model,
      photoUrl: c.photoUrl,
      isActive: c.isActive,
      createdAt: nowIso(),
      updatedAt: nowIso(),
    }))
    db.services = data.services.map((s) => ({
      id: s.id,
      name: s.name,
      isActive: s.isActive,
      createdAt: nowIso(),
      updatedAt: nowIso(),
    }))
    db.prices = data.prices.map((p) => ({
      id: p.id ?? `price_${p.carId}_${p.serviceId}`,
      carId: p.carId,
      serviceId: p.serviceId,
      price: p.price,
      createdAt: nowIso(),
      updatedAt: nowIso(),
    }))
    commitDb(db)
  },
}