import { Link } from 'react-router-dom'
import { ArrowRight, Car, FileText, FolderOpen, Gauge, ListChecks, Plus } from 'lucide-react'
import { useAllCars } from '@/hooks/use-cars'
import { useAllServices } from '@/hooks/use-services'
import { useProposals } from '@/hooks/use-proposals'
import { PageHeader } from '@/components/common/page-header'
import { EmptyState } from '@/components/common/empty-state'
import { ErrorState } from '@/components/common/error-state'
import { Skeleton } from '@/components/ui/skeleton'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/app/providers/auth'
import { formatRub } from '@/lib/money'
import { carLabel } from '@/lib/calc'
import type { Proposal } from '@/types'
import { proposalStatusMeta } from '@/lib/proposal-meta'
import { cn } from '@/lib/utils'

export function DashboardPage() {
  const { session } = useAuth()
  const carsQuery = useAllCars()
  const servicesQuery = useAllServices()
  const proposalsQuery = useProposals()

  const loading = carsQuery.isLoading || servicesQuery.isLoading || proposalsQuery.isLoading
  const error = carsQuery.isError || servicesQuery.isError || proposalsQuery.isError

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid gap-4 sm:grid-cols-3">
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
        </div>
        <Skeleton className="h-72" />
      </div>
    )
  }

  if (error) {
    return <ErrorState message="Не удалось получить данные с локального хранилища." />
  }

  const cars = carsQuery.data ?? []
  const services = servicesQuery.data ?? []
  const proposals = proposalsQuery.data ?? []
  const recent = [...proposals]
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 5)
  const carById = new Map(cars.map((c) => [c.id, c]))

  return (
    <div>
      <PageHeader
        kicker="Рабочий стол"
        title={session ? `Здравствуйте, ${session.fullName.split(' ')[0] ?? 'коллега'}` : 'PRO-TUNING'}
        description="Сводка по каталогу и последние коммерческие предложения."
        actions={
          <>
            <Button asChild variant="outline">
              <Link to="/calculator">
                <Plus className="h-4 w-4" /> Новое КП
              </Link>
            </Button>
            <Button asChild>
              <Link to="/proposals">
                <FolderOpen className="h-4 w-4" /> Все КП
              </Link>
            </Button>
          </>
        }
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <Link
          to="/cars"
          className="rounded-2xl border border-line bg-card p-5 shadow-[0_8px_28px_rgba(0,0,0,0.05)] transition-colors hover:border-red/40"
        >
          <div className="flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-xl bg-red-soft text-red">
              <Car className="h-5 w-5" />
            </div>
            <div>
              <div className="text-3xl font-black text-ink">{cars.length}</div>
              <div className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Автомобилей</div>
            </div>
          </div>
        </Link>
        <Link
          to="/services"
          className="rounded-2xl border border-line bg-card p-5 shadow-[0_8px_28px_rgba(0,0,0,0.05)] transition-colors hover:border-red/40"
        >
          <div className="flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-xl bg-soft text-sub">
              <ListChecks className="h-5 w-5" />
            </div>
            <div>
              <div className="text-3xl font-black text-ink">{services.length}</div>
              <div className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Услуг</div>
            </div>
          </div>
        </Link>
        <Link
          to="/proposals"
          className="rounded-2xl border border-line bg-card p-5 shadow-[0_8px_28px_rgba(0,0,0,0.05)] transition-colors hover:border-red/40"
        >
          <div className="flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-xl bg-soft text-sub">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <div className="text-3xl font-black text-ink">{proposals.length}</div>
              <div className="text-xs font-bold uppercase tracking-wide text-muted-foreground">КП сохранено</div>
            </div>
          </div>
        </Link>
      </div>

      <div className="mt-6">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-base font-black text-ink">Последние коммерческие предложения</h2>
          <Link to="/proposals" className="flex items-center gap-1 text-sm font-bold text-red hover:underline">
            Все <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {recent.length === 0 ? (
          <EmptyState
            icon={<Gauge className="h-7 w-7" />}
            title="Пока нет КП"
            description="Создайте первое коммерческое предложение в калькуляторе."
            action={
              <Button asChild size="sm">
                <Link to="/calculator">Открыть калькулятор</Link>
              </Button>
            }
          />
        ) : (
          <Card className="overflow-hidden">
            <div className="grid gap-px bg-line">
              {recent.map((proposal) => (
                <DashboardRow key={proposal.id} proposal={proposal} carLabel={carLabel(carById.get(proposal.carId))} />
              ))}
            </div>
          </Card>
        )}
      </div>
    </div>
  )
}

function DashboardRow({ proposal, carLabel: label }: { proposal: Proposal; carLabel: string }) {
  const meta = proposalStatusMeta[proposal.status]
  return (
    <Link
      to={`/proposals/${proposal.id}`}
      className="flex items-center justify-between gap-4 bg-card px-5 py-3.5 transition-colors hover:bg-soft"
    >
      <div className="flex min-w-0 items-center gap-3">
        <FileText className="h-4 w-4 shrink-0 text-sub" />
        <div className="min-w-0">
          <div className="truncate text-sm font-bold text-ink">
            {proposal.number} · {label}
          </div>
          <div className="truncate text-xs text-muted-foreground">{proposal.clientName || 'Без клиента'}</div>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-3">
        <span className={cn('hidden text-sm font-black sm:inline', meta.dot)}>{formatRub(proposal.total)}</span>
        <Badge variant={meta.variant}>{meta.label}</Badge>
      </div>
    </Link>
  )
}