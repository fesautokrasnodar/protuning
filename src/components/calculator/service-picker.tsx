import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatRub } from '@/lib/money'

export interface ServiceChoice {
  id: string
  name: string
  price: number
}

interface ServicePickerProps {
  options: ServiceChoice[]
  selectedIds: string[]
  onToggle: (id: string) => void
  onSelectAll: () => void
  onClear: () => void
  emptyText?: string
}

export function ServicePicker({
  options,
  selectedIds,
  onToggle,
  onSelectAll,
  onClear,
  emptyText = 'Для этой модели пока нет заполненных цен.',
}: ServicePickerProps) {
  if (options.length === 0) {
    return <p className="rounded-xl border border-dashed border-line px-4 py-6 text-center text-sm text-muted-foreground">{emptyText}</p>
  }
  const allSelected = options.length > 0 && options.every((o) => selectedIds.includes(o.id))

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <span className="text-xs font-bold text-muted-foreground">{options.length} услуг в прайсе для модели</span>
        <div className="flex gap-1">
          <button
            type="button"
            onClick={onClear}
            className="rounded-md px-2 py-1 text-xs font-bold text-muted-foreground hover:bg-soft hover:text-ink"
          >
            Очистить
          </button>
          <button
            type="button"
            onClick={onSelectAll}
            className={cn(
              'rounded-md px-2 py-1 text-xs font-bold transition-colors',
              allSelected ? 'bg-red-soft text-red hover:bg-red/10' : 'text-muted-foreground hover:bg-soft hover:text-ink',
            )}
          >
            Выбрать все
          </button>
        </div>
      </div>
      <div className="scrollbar-thin grid max-h-[420px] gap-2 overflow-auto pr-1">
        {options.map((service) => {
          const on = selectedIds.includes(service.id)
          return (
            <button
              key={service.id}
              type="button"
              onClick={() => onToggle(service.id)}
              className={cn(
                'grid grid-cols-[26px_1fr_auto] items-center gap-2.5 rounded-xl border border-line bg-white px-3 py-2.5 text-left transition-colors hover:border-[#bbbcc2]',
                on && 'border-red bg-red-soft hover:border-red',
              )}
            >
              <span
                className={cn(
                  'grid h-5 w-5 place-items-center rounded-md border border-[#c9c9cf] text-[12px] font-black text-white',
                  on && 'border-red bg-red',
                )}
              >
                {on ? <Check className="h-3.5 w-3.5" /> : null}
              </span>
              <span className="text-sm font-bold text-ink">{service.name}</span>
              <span className="whitespace-nowrap text-sm font-black text-ink">{formatRub(service.price)}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}