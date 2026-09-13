import { useMutation, useQueryClient } from '@tanstack/react-query'
import { providers } from '@/services'
import type { CarImportRow, PriceImportRow } from '@/lib/catalog-import'

export function useImportCars() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (rows: CarImportRow[]) => providers.catalogImport.importCars(rows),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['cars'] })
      void qc.invalidateQueries({ queryKey: ['prices'] })
    },
  })
}

export function useImportPrices() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (rows: PriceImportRow[]) => providers.catalogImport.importPrices(rows),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['cars'] })
      void qc.invalidateQueries({ queryKey: ['prices'] })
      void qc.invalidateQueries({ queryKey: ['services'] })
    },
  })
}