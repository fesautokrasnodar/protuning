import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import { Car as CarIcon, Pencil, Plus, Search, Trash2 } from 'lucide-react'
import { useAllCars, useCreateCar, useRemoveCar, useUpdateCar } from '@/hooks/use-cars'
import { useAuth } from '@/app/providers/auth'
import { PageHeader } from '@/components/common/page-header'
import { EmptyState } from '@/components/common/empty-state'
import { ErrorState } from '@/components/common/error-state'
import { ConfirmDialog } from '@/components/common/confirm-dialog'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { carInputSchema, type CarInput } from '@/lib/validation/schemas'
import type { Car } from '@/types'

type EditState = { type: 'create' } | { type: 'edit'; car: Car } | null

export function CarsPage() {
  const { session } = useAuth()
  const carsQuery = useAllCars()
  const createCar = useCreateCar()
  const updateCar = useUpdateCar()
  const removeCar = useRemoveCar()

  const [search, setSearch] = useState('')
  const [dialog, setDialog] = useState<EditState>(null)
  const [brand, setBrand] = useState('')
  const [model, setModel] = useState('')
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof CarInput, string>>>({})
  const [saving, setSaving] = useState(false)
  const [pendingDelete, setPendingDelete] = useState<Car | null>(null)
  const [deleting, setDeleting] = useState(false)

  const canEdit = session?.role === 'admin' || session?.role === 'manager'

  const query = search.trim().toLowerCase()
  const cars = useMemo(
    () => (carsQuery.data ?? []).filter((c) => `${c.brand} ${c.model}`.toLowerCase().includes(query)),
    [carsQuery.data, query],
  )

  function openCreate() {
    setDialog({ type: 'create' })
    setBrand('')
    setModel('')
    setFieldErrors({})
  }

  function openEdit(car: Car) {
    setDialog({ type: 'edit', car })
    setBrand(car.brand)
    setModel(car.model)
    setFieldErrors({})
  }

  async function submit() {
    const parsed = carInputSchema.safeParse({ brand, model })
    if (!parsed.success) {
      const errors: Record<string, string> = {}
      for (const issue of parsed.error.issues) {
        errors[String(issue.path[0])] = issue.message
      }
      setFieldErrors(errors)
      return
    }
    setSaving(true)
    try {
      if (dialog?.type === 'edit') {
        await updateCar.mutateAsync({ id: dialog.car.id, input: parsed.data })
        toast.success('Автомобиль обновлён')
      } else {
        await createCar.mutateAsync(parsed.data)
        toast.success('Автомобиль добавлен')
      }
      setDialog(null)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Не удалось сохранить')
    } finally {
      setSaving(false)
    }
  }

  async function confirmDelete() {
    if (!pendingDelete) return
    setDeleting(true)
    try {
      await removeCar.mutateAsync(pendingDelete.id)
      toast.success('Автомобиль удалён')
      setPendingDelete(null)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Не удалось удалить')
    } finally {
      setDeleting(false)
    }
  }

  if (carsQuery.isLoading) return <Skeleton className="h-96" />
  if (carsQuery.isError) return <ErrorState message="Не удалось загрузить автомобили." />

  return (
    <div>
      <PageHeader
        kicker="Справочник"
        title="Автомобили"
        description={`Всего: ${carsQuery.data?.length ?? 0}`}
        actions={
          canEdit ? (
            <Button onClick={openCreate}>
              <Plus className="h-4 w-4" /> Добавить автомобиль
            </Button>
          ) : null
        }
      />

      <Card className="overflow-hidden">
        <div className="border-b border-line p-4">
          <div className="relative max-w-sm">
            <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Поиск по марке или модели…"
              className="pl-9"
            />
          </div>
        </div>

        {cars.length === 0 ? (
          <EmptyState
            icon={<CarIcon className="h-7 w-7" />}
            title={carsQuery.data?.length === 0 ? 'Автомобилей пока нет' : 'Ничего не найдено'}
            description={
              carsQuery.data?.length === 0 ? 'Добавьте первую модель в справочник.' : 'Измените поисковый запрос.'
            }
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>Модель</TableHead>
                <TableHead>Статус</TableHead>
                {canEdit ? <TableHead className="w-24" /> : null}
              </TableRow>
            </TableHeader>
            <TableBody>
              {cars.map((car) => (
                <TableRow key={car.id}>
                  <TableCell className="font-bold text-ink">
                    {car.brand} {car.model}
                  </TableCell>
                  <TableCell>
                    {car.isActive ? (
                      <Badge variant="success">Активен</Badge>
                    ) : (
                      <Badge variant="muted">Неактивен</Badge>
                    )}
                  </TableCell>
                  {canEdit ? (
                    <TableCell>
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(car)}>
                          <Pencil className="h-4 w-4" />
                          <span className="sr-only">Редактировать</span>
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-red"
                          onClick={() => setPendingDelete(car)}
                        >
                          <Trash2 className="h-4 w-4" />
                          <span className="sr-only">Удалить</span>
                        </Button>
                      </div>
                    </TableCell>
                  ) : null}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>

      <Dialog open={dialog !== null} onOpenChange={(open) => !open && setDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{dialog?.type === 'edit' ? 'Редактировать автомобиль' : 'Новый автомобиль'}</DialogTitle>
            <DialogDescription>
              Название используется в калькуляторе и на коммерческом предложении.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="carBrand">Марка</Label>
              <Input
                id="carBrand"
                placeholder="Например: VOYAH"
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                aria-invalid={Boolean(fieldErrors.brand)}
              />
              {fieldErrors.brand ? <p className="text-xs font-semibold text-red">{fieldErrors.brand}</p> : null}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="carModel">Модель</Label>
              <Input
                id="carModel"
                placeholder="Например: Dream"
                value={model}
                onChange={(e) => setModel(e.target.value)}
                aria-invalid={Boolean(fieldErrors.model)}
              />
              {fieldErrors.model ? <p className="text-xs font-semibold text-red">{fieldErrors.model}</p> : null}
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDialog(null)}>
              Отмена
            </Button>
            <Button onClick={() => void submit()} disabled={saving}>
              {saving ? 'Сохраняем…' : 'Сохранить'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={pendingDelete !== null}
        onOpenChange={(open) => !open && setPendingDelete(null)}
        title="Удалить автомобиль?"
        description={
          pendingDelete ? `«${pendingDelete.brand} ${pendingDelete.model}» будет удалён. Если модель используется в КП — удаление запрещено.` : undefined
        }
        confirmText="Удалить"
        loading={deleting}
        onConfirm={() => void confirmDelete()}
      />
    </div>
  )
}