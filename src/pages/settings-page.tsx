import { useRef, useState, type ReactNode } from 'react'
import { toast } from 'sonner'
import { Car, Database, Download, FileSpreadsheet, RefreshCcw, Upload } from 'lucide-react'
import type { ImportReport } from '@/services/module'
import { providers } from '@/services'
import { PageHeader } from '@/components/common/page-header'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { backupV1Schema, type BackupV1 } from '@/lib/validation/schemas'
import { parseCarsCsv, parsePricesCsv } from '@/lib/catalog-import'
import { useImportCars, useImportPrices } from '@/hooks/use-import'
import { IS_DEMO } from '@/lib/config'

const STORAGE_DB = 'protuning_db_v1'
const STORAGE_AUTH = 'protuning_auth_v1'

function downloadBackup(data: BackupV1) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `protuning-backup-${data.exportedAt.slice(0, 10)}.json`
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}

interface ImportCardState {
  report?: ImportReport
  parseErrors: string[]
}

function ImportSummary({
  lines,
  report,
}: {
  lines: string[]
  report?: ImportReport
}) {
  const errors = [...(report?.errors ?? []), ...lines]
  if (errors.length === 0) return null
  const visible = errors.slice(0, 3)
  const rest = errors.length - visible.length
  return (
    <div className="mt-3 space-y-1 text-xs">
      {report && report.invalid > 0 ? (
        <p className="font-black text-red">Пропущено строк: {report.invalid}</p>
      ) : null}
      {visible.map((e, i) => (
        <p key={i} className="font-semibold text-muted-foreground">
          {e}
        </p>
      ))}
      {rest > 0 ? <p className="text-muted-foreground">… и ещё {rest}</p> : null}
    </div>
  )
}

function CsvImportCard({
  icon,
  title,
  hint,
  format,
  busy,
  summary,
  onChange,
}: {
  icon: ReactNode
  title: string
  hint: string
  format: string
  busy: boolean
  summary: ImportCardState | null
  onChange: (file: File) => Promise<void>
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  return (
    <Card className="p-5">
      <div className="mb-1 flex items-center gap-2">
        {icon}
        <h2 className="text-base font-black text-ink">{title}</h2>
      </div>
      <p className="text-sm leading-relaxed text-muted-foreground">{hint}</p>
      <div className="mt-4 space-y-2">
        <Label htmlFor={title} className="text-xs">
          {format}
        </Label>
        <Input
          id={title}
          ref={inputRef}
          type="file"
          accept=".csv,.txt,text/csv,text/plain"
          disabled={busy}
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (!file) return
            void onChange(file).finally(() => {
              if (inputRef.current) inputRef.current.value = ''
            })
          }}
        />
      </div>
      {summary ? <ImportSummary lines={summary.parseErrors} report={summary.report} /> : null}
    </Card>
  )
}

export function SettingsPage() {
  const [exporting, setExporting] = useState(false)
  const [importing, setImporting] = useState(false)
  const [resetting, setResetting] = useState(false)
  const [carsBusy, setCarsBusy] = useState(false)
  const [pricesBusy, setPricesBusy] = useState(false)
  const [carsSummary, setCarsSummary] = useState<ImportCardState | null>(null)
  const [pricesSummary, setPricesSummary] = useState<ImportCardState | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const importCars = useImportCars()
  const importPrices = useImportPrices()

  async function onExport() {
    setExporting(true)
    try {
      const data = await providers.backup.exportCatalog()
      downloadBackup(data)
      toast.success('Бэкап скачан')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Не удалось сформировать бэкап')
    } finally {
      setExporting(false)
    }
  }

  async function onImportFile(file: File) {
    setImporting(true)
    try {
      const raw = JSON.parse(await file.text()) as unknown
      const parsed = backupV1Schema.safeParse(raw)
      if (!parsed.success) {
        toast.error('Неверный формат файла бэкапа')
        return
      }
      await providers.backup.importCatalog(parsed.data)
      toast.success('Данные импортированы')
      window.setTimeout(() => window.location.reload(), 400)
    } catch {
      toast.error('Не удалось прочитать файл')
    } finally {
      setImporting(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  async function onImportCars(file: File) {
    setCarsBusy(true)
    try {
      const { rows, errors } = parseCarsCsv(await file.text())
      if (rows.length === 0 && errors.length === 0) {
        toast.error('Файл пуст')
        return
      }
      let report: ImportReport | undefined
      if (rows.length > 0) {
        report = await importCars.mutateAsync(rows)
        toast.success(`Импортировано автомобилей: ${report.carsCreated + report.carsMatched}`)
      }
      setCarsSummary({ report, parseErrors: errors })
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Не удалось прочитать файл')
    } finally {
      setCarsBusy(false)
    }
  }

  async function onImportPrices(file: File) {
    setPricesBusy(true)
    try {
      const { rows, errors } = parsePricesCsv(await file.text())
      if (rows.length === 0 && errors.length === 0) {
        toast.error('Файл пуст')
        return
      }
      let report: ImportReport | undefined
      if (rows.length > 0) {
        report = await importPrices.mutateAsync(rows)
        toast.success(
          `Применено цен: ${report.pricesApplied} · авто добавлено: ${report.carsCreated} · услуг создано: ${report.servicesCreated}`,
        )
      }
      setPricesSummary({ report, parseErrors: errors })
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Не удалось прочитать файл')
    } finally {
      setPricesBusy(false)
    }
  }

  function onReset() {
    if (!window.confirm('Сбросить демо-данные и выйти из системы?')) return
    localStorage.removeItem(STORAGE_DB)
    localStorage.removeItem(STORAGE_AUTH)
    setResetting(true)
    window.setTimeout(() => window.location.reload(), 200)
  }

  return (
    <div>
      <PageHeader
        kicker="Настройки"
        title="Администрирование"
        description="Резервное копирование справочника и импорт автомобилей и прайсов из CSV-файлов."
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="p-5">
          <div className="mb-1 flex items-center gap-2">
            <Download className="h-4 w-4 text-red" />
            <h2 className="text-base font-black text-ink">Экспорт</h2>
          </div>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Скачайте справочник одним JSON-файлом. КП и пользователи в бэкап не входят.
          </p>
          <Button variant="outline" className="mt-4" onClick={() => void onExport()} disabled={exporting}>
            {exporting ? 'Формируем…' : 'Скачать бэкап JSON'}
          </Button>
        </Card>

        <Card className="p-5">
          <div className="mb-1 flex items-center gap-2">
            <Upload className="h-4 w-4 text-red" />
            <h2 className="text-base font-black text-ink">Импорт</h2>
          </div>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Восстановление из бэкапа. Текущие данные будут перезаписаны, страница перезагрузится.
          </p>
          <div className="mt-4 space-y-2">
            <Label htmlFor="backupFile" className="text-xs">
              Файл бэкапа (.json)
            </Label>
            <Input
              id="backupFile"
              ref={fileInputRef}
              type="file"
              accept="application/json,.json"
              disabled={importing}
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) void onImportFile(file)
              }}
            />
          </div>
        </Card>

        <CsvImportCard
          icon={<Car className="h-4 w-4 text-red" />}
          title="Импорт автомобилей"
          hint={
            <>
              CSV с колонками <b>Марка; Модель</b>. Новые автомобили добавятся, уже существующие (по марке и модели)
              будут пропущены.
            </>
          }
          format="Файл (.csv) — Марка; Модель"
          busy={carsBusy}
          summary={carsSummary}
          onChange={onImportCars}
        />

        <CsvImportCard
          icon={<FileSpreadsheet className="h-4 w-4 text-red" />}
          title="Импорт прайсов"
          hint={
            <>
              CSV с колонками <b>Автомобиль; Услуга; Цена</b> — по одной строке на цену. Автомобиль и услуга создаются
              при отсутствии, цены обновляются.
            </>
          }
          format="Файл (.csv) — Автомобиль; Услуга; Цена"
          busy={pricesBusy}
          summary={pricesSummary}
          onChange={onImportPrices}
        />
      </div>

      {IS_DEMO ? (
        <Card className="mt-4 p-5">
          <div className="mb-1 flex items-center gap-2">
            <Database className="h-4 w-4 text-red" />
            <h2 className="text-base font-black text-ink">Демо-режим</h2>
          </div>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Данные хранятся в localStorage этого браузера. Вы можете вернуть справочник к исходному виду в любой
            момент.
          </p>
          <Button variant="ghost" className="mt-4 text-red" onClick={onReset} disabled={resetting}>
            <RefreshCcw className="h-4 w-4" />
            {resetting ? 'Сбрасываем…' : 'Сбросить демо-данные'}
          </Button>
        </Card>
      ) : null}
    </div>
  )
}