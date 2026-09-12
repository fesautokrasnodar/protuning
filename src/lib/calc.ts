import type { Car, Price, ProposalItem, Service } from '@/types'
import { sumPrices } from '@/lib/money'

export interface SelectionInput {
  serviceId: string
  serviceName: string
  price: number
}

export interface Totals {
  subtotal: number
  discount: number
  total: number
}

/** Скидка ограничивается диапазоном [0, subtotal]. */
export function clampDiscount(discount: number, subtotal: number): number {
  if (!Number.isFinite(discount)) return 0
  const clamped = Math.trunc(discount)
  if (clamped < 0) return 0
  if (clamped > subtotal) return subtotal
  return clamped
}

/** Итоговые суммы: total = subtotal - discount (без округлений). */
export function computeTotals(itemPrices: number[], discount: number): Totals {
  const subtotal = sumPrices(itemPrices)
  const d = clampDiscount(discount, subtotal)
  return { subtotal, discount: d, total: subtotal - d }
}

/** Услуги, доступные для автомобиля: цена задана (>= 0). */
export function availableServicesForCar(
  services: Service[],
  prices: Price[],
  carId: string,
): Service[] {
  const byId = new Map(prices.filter((p) => p.carId === carId).map((p) => [p.serviceId, p.price]))
  return services.filter((s) => {
    const v = byId.get(s.id)
    return typeof v === 'number' && v >= 0
  })
}

/** Цена услуги для автомобиля или null. */
export function priceForCar(prices: Price[], carId: string, serviceId: string): number | null {
  const p = prices.find((x) => x.carId === carId && x.serviceId === serviceId)
  return p?.price ?? null
}

/**
 * Snapshot КП: название услуги и цена фиксируются на момент сохранения.
 * quantity всегда 1 в первой версии.
 */
export function buildSnapshotItems(proposalId: string, selection: SelectionInput[]): ProposalItem[] {
  return selection.map((s, i) => ({
    id: `${proposalId}_item_${i}_${Math.random().toString(36).slice(2, 8)}`,
    proposalId,
    serviceId: s.serviceId,
    serviceName: s.serviceName,
    price: s.price,
    quantity: 1,
    total: s.price,
  }))
}

/** Полное имя автомобиля. */
export function carLabel(car: Car | null | undefined): string {
  if (!car) return '—'
  return `${car.brand} ${car.model}`.trim() || '—'
}