import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { providers } from '@/services'
import type { CarInput } from '@/lib/validation/schemas'

export function useCars() {
  return useQuery({
    queryKey: ['cars'],
    queryFn: () => providers.cars.listActive(),
  })
}

export function useAllCars() {
  return useQuery({
    queryKey: ['cars', 'all'],
    queryFn: () => providers.cars.listAll(),
  })
}

export function useCreateCar() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: CarInput) => providers.cars.create(input),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['cars'] })
    },
  })
}

export function useUpdateCar() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: CarInput }) => providers.cars.update(id, input),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['cars'] })
    },
  })
}

export function useSetCarPhoto() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ref }: { id: string; ref: string | null }) => providers.cars.setPhoto(id, ref),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['cars'] })
    },
  })
}

export function useRemoveCar() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => providers.cars.remove(id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['cars'] })
      void qc.invalidateQueries({ queryKey: ['prices'] })
    },
  })
}