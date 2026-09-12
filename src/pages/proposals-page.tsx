"use strict"

import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { Copy, Eye, FileText, MoreHorizontal, Printer, Trash2, Search } from 'lucide-react'
import { useProposals, useRemoveProposal } from '@/hooks/use-proposals'
import { useAllCars } from '@/hooks/use-cars'
import { useAuth } from '@/app/providers/auth'
import { PageHeader } from '@/components/common/page-header'
import { EmptyState } from '@/components/common/empty-state'
import { ErrorState } from '@/components/common/error-state'
import { ConfirmDialog } from '@/components/common/confirm-dialog'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { formatRub } from '@/lib/money'
import { carLabel } from '@/lib/calc'
import { formatProposalDate, proposalCopyText } from '@/lib/proposal-view'
import { proposalStatusMeta, PROPOSAL_STATUS_OPTIONS } from '@/lib/proposal-meta'
import type { Proposal, ProposalStatus } from '@/types'

type SortKey = 'newest' | 'oldest' | 'total'

function ProposalRowActions({
  onOpen,
  onPrint,
  onCopy,
  onDelete,
  canEdit,
}: {
  onOpen: () => void
  onPrint: () => void
  onCopy: () => void
  onDelete: () => void
  canEdit: boolean
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <MoreHorizontal className="h-4 w-4" />
          <span className="sr-only">Действия</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={onOpen}>
          <Eye className="h-4 w-4" /> Открыть
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onPrint}>
          <Printer className="h-4 w-4" /> Печать / PDF
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onCopy}>
          <Copy className="h-4 w-4" /> Скопировать
        </DropdownMenuItem>
        {canEdit ? (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-red" onClick={onDelete}>
              <Trash2 className="h-4 w-4" /> Удалить
            </DropdownMenuItem>
          </>
        ) : null}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export function ProposalsPage() {
  const { session } = useAuth()
  const navigate = useNavigate()
  const proposalsQuery = useProposals()
  const carsQuery = useAllCars()
  const removeProposal = useRemoveProposal()

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<ProposalStatus | 'all'>('all')
  const [sort, setSort] = useState<SortKey>('newest')
  const [pendingDelete, setPendingDelete] = useState<Proposal | null>(null)
  const [deleting, setDeleting] = useState(false)

  const cars = carsQuery.data ?? []
  const carById = new Map(cars.map((c) => [c.id, c]))
  const proposals = proposalsQuery.data ?? []

  const normalizedSearch = search.trim().toLowerCase()
  const filtered = [...proposals].filter((p) => {
    if (statusFilter !== 'all' && p.status !== statusFilter) return false
    if (normalizedSearch === '') return true
    const label = carLabel(carById.get(p.carId)).toLowerCase()
    return (
      p.number.toLowerCase().includes(normalizedSearch) ||
      p.clientName.toLowerCase().includes(normalizedSearch) ||
      label.includes(normalizedSearch)
    )
  })

  filtered.sort((a, b) => {
    switch (sort) {
      case 'oldest':
        return a.createdAt.localeCompare(b.createdAt)
      case 'total':
        return b.total - a.total
      case 'newest':
      default:
        return b.createdAt.localeCompare(a.createdAt)
    }
  })

  const canEdit = session?.role === 'admin'

  async function confirmDelete() {
    if (!pendingDelete) return
    setDeleting(true)
    try {
      await removeProposal.mutateAsync(pendingDelete.id)
      toast.success(`КП ${pendingDelete.number} удалено`)
      setPendingDelete(null)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Не удалось удалить КП')
    } finally {
      setDeleting(false)
    }
  }

  async function copyProposal(proposal: Proposal) {
    const label = carLabel(carById.get(proposal.carId))
    try {
      await navigator.clipboard.writeText(proposalCopyText(proposal, label))
      toast.success('КП скопировано в буфер обмена')
    } catch {
      toast.error('Не удалось скопировать')
    }
  }

  if (proposalsQuery.isLoading || carsQuery.isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-16" />
        <Skeleton className="h-96" />
      </div>
    )
  }

  if (proposalsQuery.isError || carsQuery.isError) {
    return <ErrorState message="Не удалось загрузить список КП." />
  }

  return (
    <div>
      <PageHeader
        kicker="Архив"
        title="Коммерческие предложения"
        description={`Сохранено: ${proposals.length}`}
        actions={
          canEdit ? (
            <Button asChild>
              <Link to="/calculator">Создать КП</Link>
            </Button>
          ) : null
        }
      />

      <Card className="overflow-hidden">
        <div className="flex flex-col gap-3 border-b border-line p-4 md:flex-row">
          <div className="relative flex-1">
            <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Поиск по номеру, клиенту, автомобилю…"
              className="pl-9"
            />
          </div>
          <Select value={statusFilter} onValueChange={(v: string) => setStatusFilter(v as ProposalStatus | 'all')}>
            <SelectTrigger className="w-full md:w-44">
              <SelectValue placeholder="Статус" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Все статусы</SelectItem>
              {PROPOSAL_STATUS_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={sort} onValueChange={(v: string) => setSort(v as SortKey)}>
            <SelectTrigger className="w-full md:w-40">
              <SelectValue placeholder="Сортировка" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Сначала новые</SelectItem>
              <SelectItem value="oldest">Сначала старые</SelectItem>
              <SelectItem value="total">По сумме</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {filtered.length === 0 ? (
          <EmptyState
            icon={<FileText className="h-7 w-7" />}
            title={proposals.length === 0 ? 'КП пока нет' : 'Ничего не найдено'}
            description={
              proposals.length === 0
                ? 'Создайте первое коммерческое предложение в калькуляторе.'
                : 'Попробуйте изменить параметры поиска.'
            }
            action={
              proposals.length === 0 && canEdit ? (
                <Button asChild size="sm">
                  <Link to="/calculator">Открыть калькулятор</Link>
                </Button>
              ) : undefined
            }
          />
        ) : (
          <>
            <div className="scrollbar-thin hidden overflow-x-auto md:block">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead>Номер</TableHead>
                    <TableHead>Автомобиль</TableHead>
                    <TableHead>Клиент</TableHead>
                    <TableHead>Дата</TableHead>
                    <TableHead className="text-right">Сумма</TableHead>
                    <TableHead>Статус</TableHead>
                    <TableHead className="w-10" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((proposal) => {
                    const meta = proposalStatusMeta[proposal.status]
                    const label = carLabel(carById.get(proposal.carId))
                    return (
                      <TableRow
                        key={proposal.id}
                        className="cursor-pointer"
                        onClick={() => navigate(`/proposals/${proposal.id}`)}
                      >
                        <TableCell className="font-black text-ink">{proposal.number}</TableCell>
                        <TableCell>{label}</TableCell>
                        <TableCell>
                          <div className="font-semibold">{proposal.clientName || '—'}</div>
                          {proposal.clientPhone || proposal.clientEmail ? (
                            <div className="text-xs text-muted-foreground">
                              {proposal.clientPhone || proposal.clientEmail}
                            </div>
                          ) : null}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {formatProposalDate(proposal.createdAt)}
                        </TableCell>
                        <TableCell className="text-right font-black">{formatRub(proposal.total)}</TableCell>
                        <TableCell>
                          <Badge variant={meta.variant}>{meta.label}</Badge>
                        </TableCell>
                        <TableCell onClick={(e) => e.stopPropagation()}>
                          <ProposalRowActions
                            canEdit={canEdit}
                            onOpen={() => navigate(`/proposals/${proposal.id}`)}
                            onPrint={() => navigate(`/proposals/${proposal.id}/print`)}
                            onCopy={() => void copyProposal(proposal)}
                            onDelete={() => setPendingDelete(proposal)}
                          />
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>

            <div className="divide-y divide-line md:hidden">
              {filtered.map((proposal) => {
                const meta = proposalStatusMeta[proposal.status]
                const label = carLabel(carById.get(proposal.carId))
                return (
                  <div
                    key={proposal.id}
                    className="cursor-pointer px-4 py-3 transition-colors hover:bg-soft/60"
                    onClick={() => navigate(`/proposals/${proposal.id}`)}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="font-black text-ink">{proposal.number}</div>
                        <div className="mt-0.5 text-xs text-muted-foreground">
                          {formatProposalDate(proposal.createdAt)}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={meta.variant}>{meta.label}</Badge>
                        <span onClick={(e) => e.stopPropagation()}>
                          <ProposalRowActions
                            canEdit={canEdit}
                            onOpen={() => navigate(`/proposals/${proposal.id}`)}
                            onPrint={() => navigate(`/proposals/${proposal.id}/print`)}
                            onCopy={() => void copyProposal(proposal)}
                            onDelete={() => setPendingDelete(proposal)}
                          />
                        </span>
                      </div>
                    </div>
                    <div className="mt-2 text-sm font-bold text-ink">{label}</div>
                    <div className="text-xs text-muted-foreground">
                      {proposal.clientName || 'Без клиента'}
                      {proposal.clientPhone || proposal.clientEmail
                        ? ` · ${proposal.clientPhone || proposal.clientEmail}`
                        : ''}
                    </div>
                    <div className="mt-2 text-base font-black text-ink">{formatRub(proposal.total)}</div>
                  </div>
                )
              })}
            </div>
          </>
        )}
      </Card>

      <ConfirmDialog
        open={pendingDelete !== null}
        onOpenChange={(open) => {
          if (!open) setPendingDelete(null)
        }}
        title="Удалить коммерческое предложение?"
        description={pendingDelete ? `КП ${pendingDelete.number} будет удалено без возможности восстановления.` : undefined}
        confirmText="Удалить"
        loading={deleting}
        onConfirm={() => void confirmDelete()}
      />
    </div>
  )
}