import type { Car } from '@/types'
import { DomainError, type CarsProvider } from '@/services/module'
import { commitDb, loadDb, nowIso, uid } from '@/lib/mock/db'

export const mockCarsProvider: CarsProvider = {
  async listActive() {
    return loadDb().cars.filter((c) => c.isActive)
  },
  async listAll() {
    return loadDb().cars
  },
  async create(input) {
    const db = loadDb()
    const t = nowIso()
    const car: Car = {
      id: uid('car'),
      brand: input.brand,
      model: input.model,
      photoUrl: null,
      isActive: true,
      createdAt: t,
      updatedAt: t,
    }
    db.cars.push(car)
    commitDb(db)
    return car
  },
  async update(id, input) {
    const db = loadDb()
    const car = db.cars.find((c) => c.id === id)
    if (!car) throw new DomainError('Автомобиль не найден', 'NOT_FOUND')
    car.brand = input.brand
    car.model = input.model
    car.updatedAt = nowIso()
    commitDb(db)
    return car
  },
  async remove(id) {
    const db = loadDb()
    const inUse = db.proposals.some((p) => p.carId === id)
    if (inUse) {
      throw new DomainError('Автомобиль используется в КП и не может быть удалён', 'IN_USE')
    }
    db.cars = db.cars.filter((c) => c.id !== id)
    db.prices = db.prices.filter((p) => p.carId !== id)
    commitDb(db)
  },
}