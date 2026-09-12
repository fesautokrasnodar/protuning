import type { Service } from '@/types'
import { DomainError, type ServicesProvider } from '@/services/module'
import { commitDb, loadDb, nowIso, uid } from '@/lib/mock/db'

export const mockServicesProvider: ServicesProvider = {
  async listActive() {
    return loadDb().services.filter((s) => s.isActive)
  },
  async listAll() {
    return loadDb().services
  },
  async create(input) {
    const db = loadDb()
    const t = nowIso()
    const service: Service = {
      id: uid('srv'),
      name: input.name,
      isActive: true,
      createdAt: t,
      updatedAt: t,
    }
    db.services.push(service)
    commitDb(db)
    return service
  },
  async update(id, input) {
    const db = loadDb()
    const service = db.services.find((s) => s.id === id)
    if (!service) throw new DomainError('Услуга не найдена', 'NOT_FOUND')
    service.name = input.name
    service.updatedAt = nowIso()
    commitDb(db)
    return service
  },
  async remove(id) {
    const db = loadDb()
    db.services = db.services.filter((s) => s.id !== id)
    db.prices = db.prices.filter((p) => p.serviceId !== id)
    commitDb(db)
  },
}