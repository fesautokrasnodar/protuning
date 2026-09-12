import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import { Search, X } from 'lucide-react'
import { useAllCars } from '@/hooks/use-cars'
import { useAllServices } from '@/hooks/use-services'
import { usePrices, useUpsertPrice } from '@/hooks/use-prices'
import { useDebouncedValue } from '@/hooks/use-debounce'
import { PageHeader } from '@/components/common/page-header'
import { EmptyState } from '@/components/common/empty-state'
import { ErrorState } from '@/components/common/error-state'
import { Skeleton } from '@/components/ui/skeleton'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'

const fmt = (value: number | null) => (value === null ? '' : String(value))

function PriceCell({
  carId,
  serviceId,
  saved,
  commit,
  className,
}: {
  carId: string
  serviceId: string
  saved: number | null
  commit: (carId: string, serviceId: string, price: number | null) => Promise<void>
  className?: string
}) {
  const [text, setText] = useState(() => fmt(saved))
  const [dirty, setDirty] = useState(false)

  async function doCommit() {
    if (!dirty) return
    const trimmed = text.trim().replace(/[\s\u00a0]/g, '')
    const next = trimmed === '' ? null : Number(trimmed)
    if (next !== null && (!Number.isInteger(next) || next < 0)) {
      setText(fmt(saved))
      setDirty(false)
      toast.error('Цена должна быть целым числом не меньше 0')
      return
    }
    setDirty(false)
    try {
      await commit(carId, serviceId, next)
    } catch (error) {
      setText(fmt(saved))
      setDirty(false)
      toast.error(error instanceof Error ? error.message : 'Не удалось сохранить цену')
    }
  }

  return (
    <input
      value={text}
      inputMode="numeric"
      placeholder={saved === null ? '—' : undefined}
      className={`text-right font-bold tabular-nums focus-visible:bg-red-soft ${className ?? ''} ${
        text !== '' ? 'text-ink' : 'text-sub'
      } ${dirty ? 'text-red' : ''}`}
      onChange={(e) => {
        setText(e.target.value)
        setDirty(true)
      }}
      onBlur={() => void doCommit()}
      onKeyDown={(e) => {
        if (e.key === 'Enter') (e.target as HTMLInputElement).blur()
      }}
      aria-label={`Цена услуги для автомобиля`}
      title={saved === null ? 'Цена не задана' : undefined}
    />
  )
}

export function PriceMatrixPage() {
  const carsQuery = useAllCars()
  const servicesQuery = useAllServices()
  const pricesQuery = usePrices()
  const upsert = useUpsertPrice()

  const [carFilter, setCarFilter] = useState('')
  const [serviceFilter, setServiceFilter] = useState('')

  const cars = useMemo(() => carsQuery.data ?? [], [carsQuery.data])
  const services = useMemo(() => servicesQuery.data ?? [], [servicesQuery.data])
  const prices = useMemo(() => pricesQuery.data ?? [], [pricesQuery.data])

  const priceByKey = useMemo(() => {
    const map = new Map<string, number | null>()
    for (const p of prices) {
      map.set(`${p.carId}:${p.serviceId}`, p.price)
    }
    return map
  }, [prices])

  const carQueryNormalized = useDebouncedValue(carFilter.trim().toLowerCase(), 250)
  const serviceQueryNormalized = useDebouncedValue(serviceFilter.trim().toLowerCase(), 250)

  const visibleCars = cars.filter((c) => `${c.brand} ${c.model}`.toLowerCase().includes(carQueryNormalized))
  const visibleServices = services.filter((s) => s.name.toLowerCase().includes(serviceQueryNormalized))

  const filled = prices.filter((p) => p.price !== null).length
  const totalCells = cars.length * services.length

  async function commit(carId: string, serviceId: string, price: number | null) {
    await upsert.mutateAsync({ carId, serviceId, price })
  }

  if (cars.length === 0 && services.length === 0) return <Skeleton className="h-80" />

  if (pricesQuery.isLoading || carsQuery.isLoading || servicesQuery.isLoading) {
    return <Skeleton className="h-80" />
  }

  if (pricesQuery.isError || carsQuery.isError || servicesQuery.isError) {
    return <ErrorState message="Не удалось загрузить прайс-матрицу." />
  }

  return (
    <div>
      <PageHeader
        kicker="Справочник"
        title="Прайс-матрица"
        description={
          totalCells > 0 ? `Заполнено ${filled} из ${totalCells} ячеек` : 'Добавьте автомобили и услуги в справочнике.'
        }
      />

      <Card className="overflow-hidden">
        <div className="flex flex-col gap-3 border-b border-line p-4 md:flex-row">
          <div className="relative flex-1">
            <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={carFilter}
              onChange={(e) => setCarFilter(e.target.value)}
              placeholder="Фильтр автомобилей…"
              className="pl-9"
            />
            {carFilter ? (
              <button
                type="button"
                onClick={() => setCarFilter('')}
                className="absolute top-1/2 right-2 -translate-y-1/2 rounded-md p-1 text-muted-foreground hover:text-ink"
                aria-label="Сбросить фильтр автомобилей"
              >
                <X className="h-4 w-4" />
              </button>
            ) : null}
          </div>
          <div className="relative flex-1">
            <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={serviceFilter}
              onChange={(e) => setServiceFilter(e.target.value)}
              placeholder="Фильтр услуг…"
              className="pl-9"
            />
            {serviceFilter ? (
              <button
                type="button"
                onClick={() => setServiceFilter('')}
                className="absolute top-1/2 right-2 -translate-y-1/2 rounded-md p-1 text-muted-foreground hover:text-ink"
                aria-label="Сбросить фильтр услуг"
              >
                <X className="h-4 w-4" />
              </button>
            ) : null}
          </div>
        </div>

        {visibleCars.length === 0 || visibleServices.length === 0 ? (
          <EmptyState
            title="Ничего не найдено"
            description="Измените фильтры или добавьте данные через «Автомобили» и «Услуги»."
          />
        ) : (
          <>
            <div className="scrollbar-thin hidden overflow-auto md:block">
              <table className="w-full border-collapse print-clean">
                <thead>
                  <tr>
                    <th className="sticky left-0 z-20 min-w-[220px] border-b border-r border-line bg-[#fbfbfc] px-3 py-2 text-left text-[11px] font-black uppercase tracking-wide text-muted-foreground">
                      Автомобиль
                    </th>
                    {visibleServices.map((service) => (
                      <th
                        key={service.id}
                        className="min-w-[150px] border-b border-line px-3 py-2 text-left text-[11px] font-black uppercase tracking-wide text-muted-foreground"
                      >
                        {service.name}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {visibleCars.map((car) => (
                    <tr key={car.id} className="group/row hover:bg-soft/50">
                      <td className="sticky left-0 z-10 border-b border-r border-line bg-[#fbfbfc] px-3 py-1.5 font-bold text-ink group-hover/row:bg-soft/80">
                        {car.brand} {car.model}
                        {!car.isActive ? <span className="ml-2 text-[10px] font-black text-sub">(неактивен)</span> : null}
                      </td>
                      {visibleServices.map((service) => (
                        <td key={service.id} className="border-b border-line px-3 py-1.5">
                          <PriceCell
                            carId={car.id}
                            serviceId={service.id}
                            saved={priceByKey.get(`${car.id}:${service.id}`) ?? null}
                            commit={commit}
                          />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="divide-y divide-line md:hidden">
              {visibleCars.map((car) => (
                <div key={car.id} className="p-3">
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <div className="text-sm font-black text-ink">
                      {car.brand} {car.model}
                      {!car.isActive ? <span className="ml-2 text-[10px] font-black text-sub">(неактивен)</span> : null}
                    </div>
                  </div>
                  <div className="space-y-1">
                    {visibleServices.map((service) => (
                      <div
                        key={service.id}
                        className="grid grid-cols-[1fr_auto] items-center gap-3 rounded-xl border border-line bg-white px-3 py-2"
                      >
                        <span className="text-[13px] font-semibold text-ink">{service.name}</span>
                        <span className="grid grid-cols-[auto_88px] items-center gap-1">
                          <span className="text-[12px] font-bold text-sub">₽</span>
                          <PriceCell
                            carId={car.id}
                            serviceId={service.id}
                            saved={priceByKey.get(`${car.id}:${service.id}`) ?? null}
                            commit={commit}
                            className="w-full text-sm"
                          />
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </Card>
    </div>
  )
}