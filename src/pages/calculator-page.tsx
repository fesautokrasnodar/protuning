import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Printer, Save, Copy } from 'lucide-react'
import { toast } from 'sonner'
import { useCars } from '@/hooks/use-cars'
import { useServices } from '@/hooks/use-services'
import { usePrices } from '@/hooks/use-prices'
import { useCreateProposal } from '@/hooks/use-proposals'
import { useAuth } from '@/app/providers/auth'
import { CarPicker } from '@/components/calculator/car-picker'
import { ServicePicker, type ServiceChoice } from '@/components/calculator/service-picker'
import { TotalBar } from '@/components/calculator/total-bar'
import { ProposalDocument, type ProposalViewData } from '@/components/proposal/proposal-document'
import { PageHeader } from '@/components/common/page-header'
import { Skeleton } from '@/components/ui/skeleton'
import { ErrorState } from '@/components/common/error-state'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { availableServicesForCar, computeTotals, priceForCar } from '@/lib/calc'
import { parsePrice, formatRub } from '@/lib/money'
import { formatPhoneMask } from '@/lib/phone'
import { proposalInputSchema } from '@/lib/validation/schemas'

export function CalculatorPage() {
  const { session } = useAuth()
  const navigate = useNavigate()
  const carsQuery = useCars()
  const servicesQuery = useServices()
  const pricesQuery = usePrices()
  const createProposal = useCreateProposal()

  const [carId, setCarId] = useState('')
  const [clientName, setClientName] = useState('')
  const [clientPhone, setClientPhone] = useState('')
  const [clientEmail, setClientEmail] = useState('')
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<'clientName' | 'clientPhone' | 'clientEmail', string>>>({})
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [discountInput, setDiscountInput] = useState('')
  const [saving, setSaving] = useState(false)

  const cars = carsQuery.data ?? []
  const canSave = session?.role === 'admin' || session?.role === 'manager'

  const options: ServiceChoice[] = useMemo(() => {
    if (!carId) return []
    const services = servicesQuery.data ?? []
    const prices = pricesQuery.data ?? []
    const available = availableServicesForCar(services, prices, carId)
    return available.map((s) => ({
      id: s.id,
      name: s.name,
      price: priceForCar(prices, carId, s.id) ?? 0,
    }))
  }, [carId, servicesQuery.data, pricesQuery.data])

  const validSelected = options.filter((o) => selectedIds.includes(o.id))
  const discount = parsePrice(discountInput) ?? 0
  const totals = useMemo(
    () => computeTotals(validSelected.map((o) => o.price), discount),
    [validSelected, discount],
  )

  const currentCar = cars.find((c) => c.id === carId) ?? null
  const proposalDate = new Date().toLocaleDateString('ru-RU')

  const view: ProposalViewData = {
    date: proposalDate,
    carLabel: currentCar ? `${currentCar.brand} ${currentCar.model}` : 'Выберите автомобиль',
    carPhotoUrl: currentCar?.photoUrl ?? null,
    clientName,
    clientPhone,
    clientEmail,
    items: validSelected.map((o, i) => ({ num: i + 1, name: o.name, price: o.price })),
    subtotal: totals.subtotal,
    discount: totals.discount,
    total: totals.total,
  }

  function toggleService(id: string) {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))
  }

  function selectAll() {
    setSelectedIds(options.map((o) => o.id))
  }

  function clearAll() {
    setSelectedIds([])
  }

  async function saveProposal() {
    if (!carId) {
      toast.error('Выберите автомобиль')
      return
    }
    if (validSelected.length === 0) {
      toast.error('Выберите хотя бы одну услугу')
      return
    }
    if (!session) return
    const parsed = proposalInputSchema.safeParse({
      carId,
      clientName,
      clientPhone,
      clientEmail,
      status: 'draft',
      discount: totals.discount,
      serviceIds: validSelected.map((o) => o.id),
    })
    if (!parsed.success) {
      const errors: Record<string, string> = {}
      for (const issue of parsed.error.issues) {
        const key = String(issue.path[0] ?? '')
        if (key && !errors[key]) errors[key] = issue.message
      }
      setFieldErrors(errors)
      return
    }
    setSaving(true)
    try {
      const created = await createProposal.mutateAsync({
        carId,
        clientName: parsed.data.clientName,
        clientPhone: parsed.data.clientPhone,
        clientEmail: parsed.data.clientEmail,
        status: parsed.data.status,
        discount: totals.discount,
        createdBy: session.userId,
        selection: validSelected.map((o) => ({ serviceId: o.id, serviceName: o.name, price: o.price })),
      })
      toast.success(`КП ${created.number} сохранено`)
      navigate(`/proposals/${created.id}`)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Не удалось сохранить КП')
    } finally {
      setSaving(false)
    }
  }

  async function copyProposalText() {
    const lines = [
      'КОММЕРЧЕСКОЕ ПРЕДЛОЖЕНИЕ PRO-TUNING',
      view.carLabel,
      view.clientName ? `Клиент: ${view.clientName}` : '',
      view.clientPhone ? `Телефон: ${view.clientPhone}` : '',
      view.clientEmail ? `E-mail: ${view.clientEmail}` : '',
      '',
      ...view.items.map((item) => `• ${item.name}: ${formatRub(item.price)}`),
      '',
      `ИТОГО: ${formatRub(view.total)}`,
    ]
    const text = lines.filter((l) => l !== undefined && l !== '').join('\n')
    try {
      await navigator.clipboard.writeText(text)
      toast.success('Текст КП скопирован')
    } catch {
      toast.error('Не удалось скопировать текст')
    }
  }

  if (carsQuery.isLoading || servicesQuery.isLoading || pricesQuery.isLoading) {
    return (
      <div className="grid gap-6 lg:grid-cols-[430px_1fr]">
        <Skeleton className="h-[640px]" />
        <Skeleton className="h-[1123px]" />
      </div>
    )
  }

  if (carsQuery.isError || servicesQuery.isError || pricesQuery.isError) {
    return <ErrorState message="Не удалось загрузить данные для калькулятора." />
  }

  return (
    <div className="print-mode">
      <PageHeader
        kicker="Расчёт"
        title="Стоимость тюнинга"
        description="Выберите автомобиль, клиента и услуги — КП формируется автоматически."
      />

      <div className="grid gap-6 lg:grid-cols-[430px_1fr]">
        <div className="space-y-4">
          <Card className="p-5">
            <CarPicker cars={cars} value={carId} onChange={(id) => setCarId(id)} />

            <div className="mt-4 space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="clientName">
                  Клиент / компания <span className="font-normal text-muted-foreground">(необязательно)</span>
                </Label>
                <Input
                  id="clientName"
                  placeholder="Например: Алексей / ООО Компания"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  aria-invalid={Boolean(fieldErrors.clientName)}
                />
                {fieldErrors.clientName ? (
                  <p className="text-xs font-semibold text-red">{fieldErrors.clientName}</p>
                ) : null}
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="clientPhone">
                    Телефон <span className="font-normal text-muted-foreground">(необязательно)</span>
                  </Label>
                  <Input
                    id="clientPhone"
                    inputMode="tel"
                    placeholder="+7 (___) ___-__-__"
                    value={clientPhone}
                    onChange={(e) => {
                      setClientPhone(formatPhoneMask(e.target.value))
                      setFieldErrors((p) => ({ ...p, clientPhone: undefined }))
                    }}
                    aria-invalid={Boolean(fieldErrors.clientPhone)}
                  />
                  {fieldErrors.clientPhone ? (
                    <p className="text-xs font-semibold text-red">{fieldErrors.clientPhone}</p>
                  ) : null}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="clientEmail">
                    E-mail <span className="font-normal text-muted-foreground">(необязательно)</span>
                  </Label>
                  <Input
                    id="clientEmail"
                    type="email"
                    placeholder="client@company.ru"
                    value={clientEmail}
                    onChange={(e) => {
                      setClientEmail(e.target.value)
                      setFieldErrors((p) => ({ ...p, clientEmail: undefined }))
                    }}
                    aria-invalid={Boolean(fieldErrors.clientEmail)}
                  />
                  {fieldErrors.clientEmail ? (
                    <p className="text-xs font-semibold text-red">{fieldErrors.clientEmail}</p>
                  ) : null}
                </div>
              </div>
            </div>

            <div className="mt-4">
              <Label htmlFor="discount">Скидка, ₽</Label>
              <Input
                id="discount"
                type="number"
                min={0}
                step={500}
                inputMode="numeric"
                placeholder="0"
                value={discountInput}
                onChange={(e) => setDiscountInput(e.target.value)}
                className="mt-1.5"
              />
              {discount > totals.subtotal ? (
                <p className="mt-1 text-xs font-semibold text-red">Скидка больше стоимости услуг</p>
              ) : null}
            </div>
          </Card>

          <Card className="p-5">
            <div className="mb-3 text-[11px] font-black uppercase tracking-[0.14em] text-red">Услуги</div>
            <ServicePicker
              options={options}
              selectedIds={selectedIds}
              onToggle={toggleService}
              onSelectAll={selectAll}
              onClear={clearAll}
              emptyText={carId ? 'Для этой модели пока нет заполненных цен.' : 'Сначала выберите автомобиль.'}
            />
          </Card>

          <TotalBar subtotal={totals.subtotal} discount={totals.discount} total={totals.total} />

          <div className="grid grid-cols-2 gap-2">
            <Button variant="dark" onClick={() => window.print()} disabled={saving}>
              <Printer className="h-4 w-4" /> Печать / PDF
            </Button>
            {canSave ? (
              <Button onClick={() => void saveProposal()} disabled={saving}>
                <Save className="h-4 w-4" /> {saving ? 'Сохраняем…' : 'Сохранить КП'}
              </Button>
            ) : (
              <Button variant="outline" onClick={() => void copyProposalText()}>
                <Copy className="h-4 w-4" /> Копировать КП
              </Button>
            )}
          </div>
          <p className="text-center text-[11px] text-muted-foreground">
            {canSave
              ? 'Сохранённые КП собираются в разделе «Коммерческие предложения».'
              : 'КП можно распечатать или скопировать прямо здесь. Для сохранения войдите как менеджер или администратор.'}
          </p>
        </div>

        <div className="min-w-0">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-[11px] font-black uppercase tracking-[0.14em] text-red">Предпросмотр A4</span>
            <Button variant="ghost" size="sm" asChild className="text-muted-foreground">
              <Link to="/proposals">Перейти к КП →</Link>
            </Button>
          </div>
          <div className="scrollbar-thin overflow-x-auto rounded-2xl border border-line bg-[#ececef] p-3">
            <div className="w-[794px]">
              <ProposalDocument data={view} />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}