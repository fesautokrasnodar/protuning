import { formatRub } from '@/lib/money'
import { cn } from '@/lib/utils'

interface TotalBarProps {
  subtotal: number
  discount: number
  total: number
  discountPercent?: number | null
  className?: string
}

export function TotalBar({ subtotal, discount, total, discountPercent = null, className }: TotalBarProps) {
  return (
    <div className={cn('rounded-xl bg-charcoal px-4 py-3.5 text-white', className)}>
      <div className="flex items-center justify-between text-[13px]">
        <span className="font-bold text-zinc-300">Стоимость услуг</span>
        <span className="font-black">{formatRub(subtotal)}</span>
      </div>
      <div className="mt-1 flex items-center justify-between text-[13px]">
        <span className="font-bold text-zinc-300">Скидка</span>
        <span className="font-black">
          {discount > 0 ? (
            discountPercent ? (
              <>
                {String(discountPercent).replace(/\./g, ',')} % · {formatRub(discount)}
              </>
            ) : (
              formatRub(discount)
            )
          ) : (
            '—'
          )}
        </span>
      </div>
      <div className="mt-2 flex items-center justify-between border-t border-zinc-700 pt-2">
        <span className="text-[15px] font-black">Итого</span>
        <strong className="text-[24px] font-black">{formatRub(total)}</strong>
      </div>
    </div>
  )
}