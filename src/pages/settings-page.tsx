import { useRef, useState } from 'react'
import { toast } from 'sonner'
import { Database, Download, RefreshCcw, Upload } from 'lucide-react'
import { providers } from '@/services'
import { PageHeader } from '@/components/common/page-header'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { backupV1Schema, type BackupV1 } from '@/lib/validation/schemas'
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

export function SettingsPage() {
  const [exporting, setExporting] = useState(false)
  const [importing, setImporting] = useState(false)
  const [resetting, setResetting] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

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
        description="Резервное копирование справочника: автомобили, услуги и цены."
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
          <Button
            variant="ghost"
            className="mt-4 text-red"
            onClick={onReset}
            disabled={resetting}
          >
            <RefreshCcw className="h-4 w-4" />
            {resetting ? 'Сбрасываем…' : 'Сбросить демо-данные'}
          </Button>
        </Card>
      ) : null}
    </div>
  )
}