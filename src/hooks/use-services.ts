import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { providers } from '@/services'
import type { ServiceInput } from '@/lib/validation/schemas'

const KEY = 'services'

export function useServices() {
  return useQuery({
    queryKey: [KEY],
    queryFn: () => providers.services.listActive(),
  })
}

export function useAllServices() {
  return useQuery({
    queryKey: [KEY, 'all'],
    queryFn: () => providers.services.listAll(),
  })
}

export function useCreateService() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: ServiceInput) => providers.services.create(input),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: [KEY] })
    },
  })
}

export function useUpdateService() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: ServiceInput }) => providers.services.update(id, input),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: [KEY] })
    },
  })
}

export function useRemoveService() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => providers.services.remove(id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: [KEY] })
      void qc.invalidateQueries({ queryKey: ['prices'] })
    },
  })
}