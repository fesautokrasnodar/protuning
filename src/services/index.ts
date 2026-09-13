import { isMock } from '@/lib/config'
import type {
  AuthProvider,
  BackupProvider,
  CarsProvider,
  CatalogImportProvider,
  PhotosProvider,
  PricesProvider,
  ProposalsProvider,
  ServicesProvider,
} from '@/services/module'
import { mockAuthProvider } from '@/services/mock-auth'
import { mockBackupProvider } from '@/services/mock-backup'
import { mockCarsProvider } from '@/services/mock-cars'
import { mockCatalogImportProvider } from '@/services/mock-import'
import { mockPhotosProvider } from '@/services/mock-photos'
import { mockPricesProvider } from '@/services/mock-prices'
import { mockProposalsProvider } from '@/services/mock-proposals'
import { mockServicesProvider } from '@/services/mock-services'

interface Providers {
  auth: AuthProvider
  cars: CarsProvider
  services: ServicesProvider
  prices: PricesProvider
  proposals: ProposalsProvider
  photos: PhotosProvider
  backup: BackupProvider
  catalogImport: CatalogImportProvider
}

const mockProviders: Providers = {
  auth: mockAuthProvider,
  cars: mockCarsProvider,
  services: mockServicesProvider,
  prices: mockPricesProvider,
  proposals: mockProposalsProvider,
  photos: mockPhotosProvider,
  backup: mockBackupProvider,
  catalogImport: mockCatalogImportProvider,
}

/**
 * Точка подключения бэкенда: добавьте supabase-реализации тех же контрактов
 * и переключайте по isMock, не трогая UI и бизнес-логику.
 */
export const providers: Providers = isMock
  ? mockProviders
  : new Proxy({} as Providers, {
      get: (_target, prop) => {
        const name = String(prop)
        return () => {
          throw new Error(`${name}: режим «supabase» ещё не подключён. Используйте VITE_DATA_MODE=mock.`)
        }
      },
    })