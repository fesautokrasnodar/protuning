import { z } from 'zod'
import { PROPOSAL_STATUSES, ROLES } from '@/types'
import { phoneDigits } from '@/lib/phone'

const uuid = z.string().trim().min(1).max(64)

/* ---------- Каталог ---------- */

export const carInputSchema = z.object({
  brand: z.string().trim().min(1, 'Укажите марку').max(60, 'Не более 60 символов'),
  model: z.string().trim().min(1, 'Укажите модель').max(60, 'Не более 60 символов'),
})
export type CarInput = z.infer<typeof carInputSchema>

export const serviceInputSchema = z.object({
  name: z.string().trim().min(1, 'Укажите название услуги').max(120, 'Не более 120 символов'),
})
export type ServiceInput = z.infer<typeof serviceInputSchema>

/** Цена: null = не задана. Неотрицательное целое число. */
export const priceSchema = z.number().int('Цена должна быть целой').min(0, 'Цена не может быть отрицательной').nullable()

/** Вход из текстового поля цены (оно отдаёт строку).
 * Пустая строка → null (цена не задана), иначе целое неотрицательное число.
 */
export const priceFieldSchema = z
  .string()
  .trim()
  .transform((v) => v.replace(/\s+/g, ''))
  .transform((v) => (v === '' ? null : Number(v)))
  .refine((v) => v === null || (Number.isInteger(v) && v >= 0 && v <= 100_000_000), 'Некорректная цена')

export const priceUpsertInputSchema = z.object({
  carId: uuid,
  serviceId: uuid,
  price: priceSchema,
})
export type PriceUpsertInput = z.infer<typeof priceUpsertInputSchema>

/* ---------- Auth ---------- */

export const loginSchema = z.object({
  email: z.string().trim().email('Введите корректный e-mail').max(120),
  password: z.string().min(6, 'Минимум 6 символов').max(120),
})
export type LoginInput = z.infer<typeof loginSchema>

/* ---------- Контакты клиента (необязательные, но валидные) ---------- */

/** Телефон: пусто допустимо, иначе полный номер из 10 цифр. */
export const phoneInputSchema = z
  .string()
  .trim()
  .transform(phoneDigits)
  .refine((d) => d === '' || d.length === 10, 'Введите номер полностью (10 цифр)')
  .transform((d) => (d === '' ? '' : `+7${d}`))

/** E-mail: пусто допустимо, иначе корректный e-mail. */
export const emailInputSchema = z
  .string()
  .trim()
  .transform((v) => v.replace(/\s+/g, ''))
  .refine((v) => v === '' || z.email().safeParse(v).success, 'Некорректный e-mail')

/* ---------- КП ---------- */

export const proposalInputSchema = z.object({
  carId: uuid,
  clientName: z.string().trim().max(200).default(''),
  clientPhone: phoneInputSchema.default(''),
  clientEmail: emailInputSchema.default(''),
  status: z.enum(PROPOSAL_STATUSES).default('draft'),
  discount: z.number().int().min(0, 'Скидка не может быть отрицательной').max(100_000_000),
  serviceIds: z.array(uuid).min(1, 'Выберите хотя бы одну услугу'),
})
export type ProposalInput = z.infer<typeof proposalInputSchema>

/* ---------- Backup ---------- */

export const backupV1Schema = z.object({
  version: z.literal(1),
  exportedAt: z.string(),
  cars: z.array(
    z.object({
      id: z.string().min(1),
      brand: z.string(),
      model: z.string(),
      photoUrl: z.string().nullable(),
      isActive: z.boolean(),
    }),
  ),
  services: z.array(
    z.object({
      id: z.string().min(1),
      name: z.string(),
      isActive: z.boolean(),
    }),
  ),
  prices: z.array(
    z.object({
      id: z.string().min(1).optional(),
      carId: z.string().min(1),
      serviceId: z.string().min(1),
      price: priceSchema,
    }),
  ),
})

export type BackupV1 = z.infer<typeof backupV1Schema>

export const roleSchema = z.enum(ROLES)

export { uuid }