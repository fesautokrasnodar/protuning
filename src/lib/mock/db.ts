import type { Car, Price, Proposal, Service } from '@/types'
import { DEMO_PASSWORD_HASH, type DemoUser } from '@/lib/mock/auth-util'

export const DB_KEY = 'protuning_db_v1'
export const SEED_KEY = 'protuning_seed_v1'

export interface DbShape {
  version: 1
  cars: Car[]
  services: Service[]
  prices: Price[]
  proposals: Proposal[]
  counters: Record<string, number>
  users: DemoUser[]
}

export function uid(prefix: string): string {
  return `${prefix}_${crypto.randomUUID()}`
}

export function nowIso(): string {
  return new Date().toISOString()
}

function demoUsers(): DemoUser[] {
  const base = {
    passwordHash: DEMO_PASSWORD_HASH,
  }
  return [
    { id: 'user_admin', email: 'admin@protuning.ru', fullName: 'Администратор', role: 'admin', ...base },
    { id: 'user_manager', email: 'manager@protuning.ru', fullName: 'Менеджер', role: 'manager', ...base },
    { id: 'user_viewer', email: 'viewer@protuning.ru', fullName: 'Наблюдатель', role: 'viewer', ...base },
  ]
}

function seedDatabase(): DbShape {
  const t = nowIso()
  const users = demoUsers()

  const cars: Car[] = [
    { id: 'car_voyah_dream', brand: 'VOYAH', model: 'Dream', photoUrl: null, isActive: true, createdAt: t, updatedAt: t },
    { id: 'car_tank_500', brand: 'TANK', model: '500', photoUrl: null, isActive: true, createdAt: t, updatedAt: t },
    { id: 'car_geely_monjaro', brand: 'GEELY', model: 'Monjaro', photoUrl: null, isActive: true, createdAt: t, updatedAt: t },
  ]

  const services: Service[] = [
    { id: 'srv_light', name: 'Замена штатного света / LED', isActive: true, createdAt: t, updatedAt: t },
    { id: 'srv_seat', name: 'Комфорт сидений / дооснащение', isActive: true, createdAt: t, updatedAt: t },
    { id: 'srv_glass', name: 'Тонировка / защита стёкол', isActive: true, createdAt: t, updatedAt: t },
    { id: 'srv_detail', name: 'Детейлинг / защитные покрытия', isActive: true, createdAt: t, updatedAt: t },
    { id: 'srv_multimedia', name: 'Мультимедиа / электроника', isActive: true, createdAt: t, updatedAt: t },
    { id: 'srv_wheels', name: 'Колёса / внешний тюнинг', isActive: true, createdAt: t, updatedAt: t },
  ]

  const priceMap: Record<string, Record<string, number>> = {
    srv_light: { car_voyah_dream: 45000, car_tank_500: 42000, car_geely_monjaro: 39000 },
    srv_seat: { car_voyah_dream: 68000, car_tank_500: 62000, car_geely_monjaro: 58000 },
    srv_glass: { car_voyah_dream: 28000, car_tank_500: 26000, car_geely_monjaro: 24000 },
    srv_detail: { car_voyah_dream: 55000, car_tank_500: 52000, car_geely_monjaro: 49000 },
    srv_multimedia: { car_voyah_dream: 85000, car_tank_500: 78000, car_geely_monjaro: 73000 },
    srv_wheels: { car_voyah_dream: 120000, car_tank_500: 115000, car_geely_monjaro: 110000 },
  }

  const prices: Price[] = []
  for (const [serviceId, byCar] of Object.entries(priceMap)) {
    for (const [carId, price] of Object.entries(byCar)) {
      prices.push({ id: uid('price'), carId, serviceId, price, createdAt: t, updatedAt: t })
    }
  }

  return { version: 1, cars, services, prices, proposals: [], counters: {}, users }
}

/** Минимальная проверка структуры. */
function isValidDb(x: unknown): x is DbShape {
  if (typeof x !== 'object' || x === null) return false
  const d = x as Partial<DbShape>
  return (
    d.version === 1 &&
    Array.isArray(d.cars) &&
    Array.isArray(d.services) &&
    Array.isArray(d.prices) &&
    Array.isArray(d.proposals) &&
    typeof d.counters === 'object' &&
    d.counters !== null &&
    Array.isArray(d.users)
  )
}

/** Прочитать БД; при отсутствии/повреждении — сидировать. */
export function loadDb(): DbShape {
  try {
    const raw = localStorage.getItem(DB_KEY)
    if (raw) {
      const parsed: unknown = JSON.parse(raw)
      if (isValidDb(parsed)) return parsed
    }
  } catch {
    /* повреждённые данные — пересоздаём */
  }
  const db = seedDatabase()
  commitDb(db)
  localStorage.setItem(SEED_KEY, '1')
  return db
}

export function commitDb(db: DbShape): void {
  localStorage.setItem(DB_KEY, JSON.stringify(db))
}