import { describe, expect, it } from 'vitest'
import {
  backupV1Schema,
  carInputSchema,
  loginSchema,
  priceFieldSchema,
  priceSchema,
  proposalInputSchema,
  serviceInputSchema,
} from '@/lib/validation/schemas'

describe('carInputSchema', () => {
  it('принимает корректные данные', () => {
    expect(carInputSchema.safeParse({ brand: 'VOYAH', model: 'Dream' }).success).toBe(true)
  })

  it('отклоняет пустые поля', () => {
    expect(carInputSchema.safeParse({ brand: ' ', model: 'Dream' }).success).toBe(false)
    expect(carInputSchema.safeParse({ brand: 'VOYAH', model: '' }).success).toBe(false)
  })
})

describe('serviceInputSchema', () => {
  it('принимает корректное название', () => {
    expect(serviceInputSchema.safeParse({ name: 'Шумоизоляция дверей' }).success).toBe(true)
  })

  it('отклоняет пустое название', () => {
    expect(serviceInputSchema.safeParse({ name: '   ' }).success).toBe(false)
  })
})

describe('priceSchema', () => {
  it('допускает целые неотрицательные и null', () => {
    expect(priceSchema.safeParse(0).success).toBe(true)
    expect(priceSchema.safeParse(150000).success).toBe(true)
    expect(priceSchema.safeParse(null).success).toBe(true)
    expect(priceSchema.safeParse(-1).success).toBe(false)
    expect(priceSchema.safeParse(150.5).success).toBe(false)
  })
})

describe('priceFieldSchema', () => {
  it('пустая строка -> null', () => {
    expect(priceFieldSchema.parse('')).toBeNull()
    expect(priceFieldSchema.parse('   ')).toBeNull()
  })

  it('строка -> целое число', () => {
    expect(priceFieldSchema.parse('15 000')).toBe(15000)
    expect(priceFieldSchema.parse('0')).toBe(0)
  })

  it('отклоняет не-числа и отрицательные', () => {
    expect(priceFieldSchema.safeParse('abc').success).toBe(false)
    expect(priceFieldSchema.safeParse('-5').success).toBe(false)
  })
})

describe('loginSchema', () => {
  it('принимает e-mail и пароль', () => {
    expect(loginSchema.safeParse({ email: 'a@b.ru', password: 'secret1' }).success).toBe(true)
  })

  it('отклоняет неверный e-mail и короткий пароль', () => {
    expect(loginSchema.safeParse({ email: 'not-email', password: 'secret1' }).success).toBe(false)
    expect(loginSchema.safeParse({ email: 'a@b.ru', password: '123' }).success).toBe(false)
  })
})

describe('proposalInputSchema', () => {
  const base = {
    carId: 'car_voyah_dream',
    clientName: 'Алексей',
    clientContact: '',
    status: 'draft' as const,
    discount: 0,
  }

  it('требует хотя бы одну услугу', () => {
    const ok = proposalInputSchema.safeParse({ ...base, serviceIds: ['srv_any'] })
    expect(ok.success).toBe(true)
    const bad = proposalInputSchema.safeParse({ ...base, serviceIds: [] })
    expect(bad.success).toBe(false)
  })

  it('принимает не-uuid идентификаторы (mock-режим)', () => {
    const ok = proposalInputSchema.safeParse({ ...base, serviceIds: ['srv_noise_doors'] })
    expect(ok.success).toBe(true)
  })

  it('отклоняет отрицательную скидку', () => {
    const bad = proposalInputSchema.safeParse({ ...base, discount: -1, serviceIds: ['x'] })
    expect(bad.success).toBe(false)
  })
})

describe('backupV1Schema', () => {
  it('принимает типовой бэкап', () => {
    const data = {
      version: 1 as const,
      exportedAt: '2026-09-12T00:00:00.000Z',
      cars: [{ id: 'car1', brand: 'VOYAH', model: 'Dream', photoUrl: null, isActive: true }],
      services: [{ id: 's1', name: 'Шумоизоляция', isActive: true }],
      prices: [{ carId: 'car1', serviceId: 's1', price: 15000 }],
    }
    expect(backupV1Schema.safeParse(data).success).toBe(true)
  })

  it('отклоняет неверную версию', () => {
    const data = { version: 2, cars: [], services: [], exportedAt: '' }
    expect(backupV1Schema.safeParse(data).success).toBe(false)
  })
})