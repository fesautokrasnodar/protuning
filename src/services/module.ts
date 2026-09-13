import type { Car, Service, Price, Proposal, Session, ProposalStatus } from '@/types'
import type { CarInput, LoginInput, PriceUpsertInput, ServiceInput, BackupV1 } from '@/lib/validation/schemas'
import type { SelectionInput } from '@/lib/calc'

/* ============================================================
   Контракты (реализацию mock можно заменить на Supabase без изменения UI)
   ============================================================ */

export class DomainError extends Error {
  readonly code: string
  constructor(message: string, code: string) {
    super(message)
    this.name = 'DomainError'
    this.code = code
  }
}

export interface CarsProvider {
  listActive(): Promise<Car[]>
  listAll(): Promise<Car[]>
  create(input: CarInput): Promise<Car>
  update(id: string, input: CarInput): Promise<Car>
  /** Установить/заменить/удалить фото (ref из PhotosProvider.upload; null — удалить). */
  setPhoto(id: string, ref: string | null): Promise<Car>
  remove(id: string): Promise<void>
}

export interface ServicesProvider {
  listActive(): Promise<Service[]>
  listAll(): Promise<Service[]>
  create(input: ServiceInput): Promise<Service>
  update(id: string, input: ServiceInput): Promise<Service>
  remove(id: string): Promise<void>
}

export interface PricesProvider {
  list(): Promise<Price[]>
  upsert(input: PriceUpsertInput): Promise<void>
  setMany(entries: { carId: string; serviceId: string; price: number | null }[]): Promise<void>
}

export interface PhotosProvider {
  /** Сжатие + «загрузка»; возвращает ссылку (mock: dataURL; prod: storage URL). */
  upload(file: File): Promise<string>
  remove(ref: string): Promise<void>
}

export interface CreateProposalData {
  carId: string
  clientName: string
  clientPhone: string
  clientEmail: string
  status: ProposalStatus
  discount: number
  createdBy: string
  selection: SelectionInput[]
}

export interface ProposalsProvider {
  list(): Promise<Proposal[]>
  get(id: string): Promise<Proposal | null>
  create(data: CreateProposalData): Promise<Proposal>
  update(id: string, data: CreateProposalData): Promise<Proposal>
  updateStatus(id: string, status: ProposalStatus): Promise<Proposal>
  remove(id: string): Promise<void>
  nextNumber(year: number): string
}

export interface AuthProvider {
  getSession(): Promise<Session | null>
  login(input: LoginInput): Promise<Session>
  logout(): Promise<void>
}

export interface BackupProvider {
  exportCatalog(): Promise<BackupV1>
  importCatalog(data: BackupV1): Promise<void>
}

/** Итоги импорта справочника (CSV). errors — только для строк, отброшенных при применении, вида «строка N: причина». */
export interface ImportReport {
  carsCreated: number
  carsMatched: number
  servicesCreated: number
  pricesApplied: number
  invalid: number
  errors: string[]
}

export interface CatalogImportProvider {
  /** Добавить автомобили (ключ = марка+модель); существующие не меняются. */
  importCars(rows: { brand: string; model: string }[]): Promise<ImportReport>
  /** Импортировать прайсы: автомобиль и услуга создаются при отсутствии, цены обновляются. */
  importPrices(rows: { carKey: string; serviceKey: string; price: number }[]): Promise<ImportReport>
}