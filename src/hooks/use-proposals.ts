import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { providers } from '@/services'
import type { CreateProposalData } from '@/services/module'
import type { ProposalStatus } from '@/types'

const KEY = 'proposals'

export function useProposals() {
  return useQuery({
    queryKey: [KEY],
    queryFn: () => providers.proposals.list(),
  })
}

export function useProposal(id: string | undefined) {
  return useQuery({
    queryKey: [KEY, id],
    queryFn: () => providers.proposals.get(id as string),
    enabled: Boolean(id),
  })
}

export function useCreateProposal() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: CreateProposalData) => providers.proposals.create(data),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: [KEY] })
    },
  })
}

export function useUpdateProposal() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: CreateProposalData }) => providers.proposals.update(id, data),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: [KEY] })
    },
  })
}

export function useUpdateProposalStatus() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: ProposalStatus }) =>
      providers.proposals.updateStatus(id, status),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: [KEY] })
    },
  })
}

export function useRemoveProposal() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => providers.proposals.remove(id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: [KEY] })
    },
  })
}