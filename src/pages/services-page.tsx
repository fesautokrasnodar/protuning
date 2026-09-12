import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import { ListChecks, Pencil, Plus, Search, Trash2 } from 'lucide-react'
import { useAllServices, useCreateService, useRemoveService, useUpdateService } from '@/hooks/use-services'
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
import { serviceInputSchema } from '@/lib/validation/schemas'
import type { Service } from '@/types'

type EditState = { type: 'create' } | { type: 'edit'; service: Service } | null

export function ServicesPage() {
  const { session } = useAuth()
  const servicesQuery = useAllServices()
  const createService = useCreateService()
  const updateService = useUpdateService()
  const removeService = useRemoveService()

  const [search, setSearch] = useState('')
  const [dialog, setDialog] = useState<EditState>(null)
  const [name, setName] = useState('')
  const [fieldError, setFieldError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [pendingDelete, setPendingDelete] = useState<Service | null>(null)
  const [deleting, setDeleting] = useState(false)

  const canEdit = session?.role === 'admin'

  const query = search.trim().toLowerCase()
  const services = useMemo(
    () => (servicesQuery.data ?? []).filter((s) => s.name.toLowerCase().includes(query)),
    [servicesQuery.data, query],
  )

  function openCreate() {
    setDialog({ type: 'create' })
    setName('')
    setFieldError(null)
  }

  function openEdit(service: Service) {
    setDialog({ type: 'edit', service })
    setName(service.name)
    setFieldError(null)
  }

  async function submit() {
    const parsed = serviceInputSchema.safeParse({ name })
    if (!parsed.success) {
      setFieldError(parsed.error.issues[0]?.message ?? 'Проверьте название')
      return
    }
    setSaving(true)
    try {
      if (dialog?.type === 'edit') {
        await updateService.mutateAsync({ id: dialog.service.id, input: parsed.data })
        toast.success('Услуга обновлена')
      } else {
        await createService.mutateAsync(parsed.data)
        toast.success('Услуга добавлена')
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
      await removeService.mutateAsync(pendingDelete.id)
      toast.success('Услуга удалена')
      setPendingDelete(null)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Не удалось удалить')
    } finally {
      setDeleting(false)
    }
  }

  if (servicesQuery.isLoading) return <Skeleton className="h-96" />
  if (servicesQuery.isError) return <ErrorState message="Не удалось загрузить услуги." />

  return (
    <div>
      <PageHeader
        kicker="Справочник"
        title="Услуги"
        description={`Всего: ${servicesQuery.data?.length ?? 0}`}
        actions={
          canEdit ? (
            <Button onClick={openCreate}>
              <Plus className="h-4 w-4" /> Добавить услугу
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
              placeholder="Поиск по названию…"
              className="pl-9"
            />
          </div>
        </div>

        {services.length === 0 ? (
          <EmptyState
            icon={<ListChecks className="h-7 w-7" />}
            title={servicesQuery.data?.length === 0 ? 'Услуг пока нет' : 'Ничего не найдено'}
            description={
              servicesQuery.data?.length === 0 ? 'Добавьте первую услугу в справочник.' : 'Измените поисковый запрос.'
            }
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>Название</TableHead>
                <TableHead>Статус</TableHead>
                {canEdit ? <TableHead className="w-24" /> : null}
              </TableRow>
            </TableHeader>
            <TableBody>
              {services.map((service) => (
                <TableRow key={service.id}>
                  <TableCell className="font-bold text-ink">{service.name}</TableCell>
                  <TableCell>
                    {service.isActive ? (
                      <Badge variant="success">Активна</Badge>
                    ) : (
                      <Badge variant="muted">Неактивна</Badge>
                    )}
                  </TableCell>
                  {canEdit ? (
                    <TableCell>
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => openEdit(service)}
                        >
                          <Pencil className="h-4 w-4" />
                          <span className="sr-only">Редактировать</span>
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-red"
                          onClick={() => setPendingDelete(service)}
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
            <DialogTitle>{dialog?.type === 'edit' ? 'Редактировать услугу' : 'Новая услуга'}</DialogTitle>
            <DialogDescription>Название услуги из прайс-матрицы.</DialogDescription>
          </DialogHeader>
          <div className="space-y-1.5">
            <Label htmlFor="serviceName">Название</Label>
            <Input
              id="serviceName"
              placeholder="Например: Шумоизоляция дверей 3 слоя"
              value={name}
              onChange={(e) => setName(e.target.value)}
              aria-invalid={Boolean(fieldError)}
            />
            {fieldError ? <p className="text-xs font-semibold text-red">{fieldError}</p> : null}
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
        title="Удалить услугу?"
        description="Услуга будет удалена, связанные цены очистятся. КП хранят собственный снапшот состава."
        confirmText="Удалить"
        loading={deleting}
        onConfirm={() => void confirmDelete()}
      />
    </div>
  )
}