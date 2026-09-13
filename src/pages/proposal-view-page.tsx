import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import { ArrowLeft, Copy, Printer, Trash2 } from 'lucide-react'
import { useProposal, useRemoveProposal, useUpdateProposalStatus } from '@/hooks/use-proposals'
import { useAllCars } from '@/hooks/use-cars'
import { useAuth } from '@/app/providers/auth'
import { PageHeader } from '@/components/common/page-header'
import { ErrorState } from '@/components/common/error-state'
import { ConfirmDialog } from '@/components/common/confirm-dialog'
import { Spinner } from '@/components/common/spinner'
import { ProposalDocument } from '@/components/proposal/proposal-document'
import { A4PreviewFrame } from '@/components/proposal/a4-preview-frame'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { carLabel } from '@/lib/calc'
import { proposalCopyText, proposalToView } from '@/lib/proposal-view'
import { proposalStatusMeta, PROPOSAL_STATUS_OPTIONS } from '@/lib/proposal-meta'
import type { ProposalStatus } from '@/types'

export function ProposalViewPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { session } = useAuth()
  const proposalQuery = useProposal(id)
  const carsQuery = useAllCars()
  const updateStatus = useUpdateProposalStatus()
  const removeProposal = useRemoveProposal()

  const [confirmOpen, setConfirmOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const proposal = proposalQuery.data
  const car = proposal ? carsQuery.data?.find((c) => c.id === proposal.carId) : undefined
  const canEdit = session?.role === 'admin'

  if (proposalQuery.isLoading || carsQuery.isLoading) {
    return (
      <div className="grid place-items-center py-24">
        <Spinner />
      </div>
    )
  }

  if (proposalQuery.isError || !proposal) {
    return <ErrorState message="Коммерческое предложение не найдено." />
  }

  const p = proposal
  const view = proposalToView(p, car)
  const meta = proposalStatusMeta[p.status]

  async function onChangeStatus(next: ProposalStatus) {
    if (next === p.status) return
    try {
      await updateStatus.mutateAsync({ id: p.id, status: next })
      toast.success('Статус обновлён')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Не удалось обновить статус')
    }
  }

  async function onCopy() {
    const text = proposalCopyText(p, carLabel(car))
    try {
      await navigator.clipboard.writeText(text)
      toast.success('КП скопировано в буфер обмена')
    } catch {
      toast.error('Не удалось скопировать')
    }
  }

  async function onDelete() {
    setDeleting(true)
    try {
      await removeProposal.mutateAsync(p.id)
      toast.success('КП удалено')
      navigate('/proposals')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Не удалось удалить КП')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="print-mode">
      <PageHeader
        kicker="Просмотр"
        title={p.number}
        description={
          p.clientName || p.clientPhone || p.clientEmail
            ? [p.clientName, p.clientPhone, p.clientEmail].filter(Boolean).join(' · ')
            : undefined
        }
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="ghost" className="text-muted-foreground" onClick={() => navigate('/proposals')}>
              <ArrowLeft className="h-4 w-4" /> Назад
            </Button>
            <Badge variant={meta.variant}>{meta.label}</Badge>
            {canEdit ? (
              <Select value={p.status} onValueChange={(v: string) => void onChangeStatus(v as ProposalStatus)}>
                <SelectTrigger className="w-44">
                  <SelectValue placeholder="Статус" />
                </SelectTrigger>
                <SelectContent>
                  {PROPOSAL_STATUS_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : null}
            <Button variant="dark" onClick={onCopy}>
              <Copy className="h-4 w-4" /> Копировать
            </Button>
            <Button variant="outline" onClick={() => navigate(`/proposals/${p.id}/print`)}>
              <Printer className="h-4 w-4" /> Печать / PDF
            </Button>
            {canEdit ? (
              <Button variant="ghost" className="text-red" onClick={() => setConfirmOpen(true)}>
                <Trash2 className="h-4 w-4" /> Удалить
              </Button>
            ) : null}
          </div>
        }
      />

      <div className="rounded-2xl border border-line bg-[#ececef] p-3">
        <A4PreviewFrame>
          <ProposalDocument data={view} />
        </A4PreviewFrame>
      </div>

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Удалить коммерческое предложение?"
        description={`КП ${proposal.number} будет удалено без возможности восстановления.`}
        confirmText="Удалить"
        loading={deleting}
        onConfirm={() => void onDelete()}
      />
    </div>
  )
}