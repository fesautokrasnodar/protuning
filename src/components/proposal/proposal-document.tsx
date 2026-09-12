import { formatRub } from '@/lib/money'

export interface ProposalItemView {
  num: number
  name: string
  price: number
}

export interface ProposalViewData {
  number?: string
  date: string
  carLabel: string
  carPhotoUrl: string | null
  clientName: string
  clientPhone: string
  clientEmail: string
  items: ProposalItemView[]
  subtotal: number
  discount: number
  total: number
}

const BENEFITS = [
  { title: 'ПРЕМИАЛЬНЫЙ СЕРВИС', text: 'Работы выполняются специалистами по дооснащению.' },
  { title: 'КАЧЕСТВО В ДЕТАЛЯХ', text: 'Аккуратный монтаж и проверка результата.' },
  { title: 'ЗАБОТА ОБ АВТОМОБИЛЕ', text: 'Индивидуальный подбор решений под конкретную модель.' },
]

/**
 * A4-документ КП (794×1123 px соответствует A4 @96dpi).
 * Используется в калькуляторе (превью) и на страницах просмотра/печати.
 */
export function ProposalDocument({ data }: { data: ProposalViewData }) {
  return (
    <article className="proposal-doc relative mx-auto w-[794px] min-h-[1123px] overflow-hidden bg-white shadow-[0_12px_30px_rgba(0,0,0,0.11)] print:shadow-none">
      <div className="pointer-events-none absolute -top-40 -right-24 z-0 h-[360px] w-[380px] rotate-[28deg] bg-red" />

      <header className="relative z-10 flex min-h-[135px] items-start justify-between bg-charcoal px-[38px] py-8 text-white">
        <div className="flex items-center gap-3">
          <img src="logo.webp" alt="PRO-TUNING" className="h-[52px] max-w-[245px] object-contain" />
        </div>
        <div className="text-right text-[13px] leading-relaxed text-zinc-300">
          <div className="text-sm font-black tracking-[0.16em] text-white">ПЕРСОНАЛЬНОЕ ПРЕДЛОЖЕНИЕ</div>
          <div className="text-[12px]">{data.number ?? ''}</div>
          <div className="text-[12px]">{data.date}</div>
        </div>
      </header>

      <div className="relative z-10 grid min-h-[300px] grid-cols-[1.05fr_0.95fr]">
        <div className="px-[36px] py-[42px]">
          <div className="text-[13px] font-black uppercase tracking-[0.14em] text-red">PRO-TUNING</div>
          <h1 className="mt-2 text-[34px] font-black leading-[1.05] tracking-tight text-ink">{data.carLabel}</h1>
          <p className="mt-3 text-[15px] leading-relaxed text-sub">
            Индивидуальный комплект дооснащения и тюнинга с установкой профессиональной командой.
          </p>
        </div>
        <div className="relative flex items-center justify-center overflow-hidden bg-gradient-to-br from-[#f7f7f8] to-[#dedee2]">
          <div className="pointer-events-none absolute -bottom-[90px] -left-[35px] h-[260px] w-[150px] rotate-[30deg] bg-red" />
          {data.carPhotoUrl ? (
            <img src={data.carPhotoUrl} alt={data.carLabel} className="relative z-[2] h-full w-full object-contain p-[18px]" />
          ) : (
            <div className="relative z-[3] p-6 text-center text-[13px] font-bold leading-relaxed text-sub">
              Фото автомобиля добавляется
              <br />
              в разделе «Автомобили»
            </div>
          )}
        </div>
      </div>

      <div className="px-[36px]">
        <div className="grid grid-cols-3 gap-2.5">
          <div className="min-h-[62px] border-t-[3px] border-ink bg-[#f5f5f6] px-3 py-2.5">
            <div className="mb-1 text-[10px] font-black uppercase tracking-wide text-sub">Автомобиль</div>
            <div className="text-[13px] font-bold text-ink">{data.carLabel}</div>
          </div>
          <div className="min-h-[62px] border-t-[3px] border-ink bg-[#f5f5f6] px-3 py-2.5">
            <div className="mb-1 text-[10px] font-black uppercase tracking-wide text-sub">Клиент</div>
            <div className="text-[13px] font-bold text-ink">{data.clientName || '—'}</div>
          </div>
          <div className="min-h-[62px] border-t-[3px] border-ink bg-[#f5f5f6] px-3 py-2.5">
            <div className="mb-1 text-[10px] font-black uppercase tracking-wide text-sub">Контакт</div>
            <div className="text-[13px] font-bold break-words text-ink">
              {data.clientPhone || data.clientEmail ? (
                <>
                  {data.clientPhone ? <div>{data.clientPhone}</div> : null}
                  {data.clientEmail ? <div>{data.clientEmail}</div> : null}
                </>
              ) : (
                '—'
              )}
            </div>
          </div>
        </div>

        <div className="mt-4 flex items-end justify-between border-b border-line pb-2">
          <h2 className="text-lg font-black text-ink">Комплектация работ</h2>
          <span className="text-[11px] text-sub">Стоимость с учётом выбранной модели</span>
        </div>

        {data.items.length === 0 ? (
          <div className="py-8 text-center text-[13px] text-sub">Выберите услуги для расчёта</div>
        ) : (
          <div className="mt-1">
            {data.items.map((item) => (
              <div
                key={item.num}
                className="grid grid-cols-[30px_1fr_145px] items-center gap-2 border-b border-[#e5e5e8] py-2.5 text-[13px]"
              >
                <div className="text-sub">{item.num}</div>
                <div className="font-bold text-ink">{item.name}</div>
                <div className="text-right font-black text-ink">{formatRub(item.price)}</div>
              </div>
            ))}
          </div>
        )}

        <div className="relative mt-4 flex items-center justify-between overflow-hidden bg-charcoal py-4 pl-9 pr-9 text-white print-clean">
          <span className="pointer-events-none absolute top-1/2 left-2 h-12 w-1.5 -translate-y-1/2 rotate-[24deg] bg-red" />
          <span className="pointer-events-none absolute top-1/2 right-2 h-12 w-1.5 -translate-y-1/2 rotate-[24deg] bg-red" />
          <span className="text-[16px] font-black">ИТОГО</span>
          <strong className="text-[27px] font-black">{formatRub(data.total)}</strong>
        </div>

        <div className="mt-3.5 grid grid-cols-3 gap-2">
          {BENEFITS.map((b) => (
            <div key={b.title} className="min-h-[60px] border border-line px-3 py-2.5">
              <div className="mb-1 text-[11px] font-black text-ink">{b.title}</div>
              <div className="text-[10px] leading-snug text-sub">{b.text}</div>
            </div>
          ))}
        </div>

        <div className="mt-3.5 text-[9px] leading-relaxed text-sub">
          Коммерческое предложение сформировано автоматически. Итоговая стоимость может корректироваться после
          осмотра автомобиля и согласования состава работ.
        </div>
      </div>
    </article>
  )
}