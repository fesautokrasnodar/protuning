import type { BadgeProps } from '@/components/ui/badge'
import type { ProposalStatus } from '@/types'

export interface StatusMeta {
  label: string
  variant: BadgeProps['variant']
  dot: string
}

export const proposalStatusMeta: Record<ProposalStatus, StatusMeta> = {
  draft: { label: 'Черновик', variant: 'secondary', dot: 'text-sub' },
  sent: { label: 'Отправлено', variant: 'info', dot: 'text-sky-700' },
  approved: { label: 'Согласовано', variant: 'success', dot: 'text-emerald-700' },
  rejected: { label: 'Отклонено', variant: 'danger', dot: 'text-red-dark' },
  archived: { label: 'В архиве', variant: 'muted', dot: 'text-sub' },
}

export const PROPOSAL_STATUS_OPTIONS: { value: ProposalStatus; label: string }[] = [
  { value: 'draft', label: 'Черновик' },
  { value: 'sent', label: 'Отправлено' },
  { value: 'approved', label: 'Согласовано' },
  { value: 'rejected', label: 'Отклонено' },
  { value: 'archived', label: 'В архиве' },
]