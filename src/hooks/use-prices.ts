import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { providers } from '@/services'
import type { PriceUpsertInput } from '@/lib/validation/schemas'

const KEY = 'prices'

export function usePrices() {
  return useQuery({
    queryKey: [KEY],
    queryFn: () => providers.prices.list(),
  })
}

export function useUpsertPrice() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: PriceUpsertInput) => providers.prices.upsert(input),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: [KEY] })
    },
  })
}

export function useSetPrices() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (entries: { carId: string; serviceId: string; price: number | null }[]) =>
      providers.prices.setMany(entries),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: [KEY] })
    },
  })
}