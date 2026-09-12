import { useRef, useState } from 'react'
import { toast } from 'sonner'
import { ImagePlus, Loader2, Trash2 } from 'lucide-react'
import { providers } from '@/services'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { ACCEPTED_IMAGE_TYPES } from '@/services/mock-photos'

interface PhotoPickerProps {
  value: string | null
  onChange: (url: string | null) => void
  className?: string
}

/**
 * Выбор фото автомобиля: сжатие через PhotosProvider (1200×760, JPEG q0.82),
 * предпросмотр и удаление.
 */
export function PhotoPicker({ value, onChange, className }: PhotoPickerProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)

  async function handleFile(file: File) {
    setUploading(true)
    try {
      const ref = await providers.photos.upload(file)
      onChange(ref)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Не удалось загрузить фото')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className={cn('rounded-xl border border-dashed border-line bg-soft/50 p-3', className)}>
      <div className="flex items-center gap-3">
        {value ? (
          <img
            src={value}
            alt="Фото автомобиля"
            className="h-20 w-28 shrink-0 rounded-lg border border-line bg-white object-contain"
          />
        ) : (
          <div
            className={cn(
              'grid h-20 w-28 shrink-0 place-items-center rounded-lg border border-line bg-white text-sub',
              uploading && 'animate-pulse',
            )}
          >
            {uploading ? <Loader2 className="h-5 w-5 animate-spin" /> : <ImagePlus className="h-6 w-6" />}
          </div>
        )}

        <div className="space-y-2">
          <input
            ref={inputRef}
            type="file"
            accept={ACCEPTED_IMAGE_TYPES.join(',')}
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) void handleFile(file)
              e.target.value = ''
            }}
          />
          <div className="flex gap-2">
            <Button type="button" variant="outline" size="sm" disabled={uploading} onClick={() => inputRef.current?.click()}>
              {uploading ? 'Обработка…' : value ? 'Заменить фото' : 'Загрузить фото'}
            </Button>
            {value ? (
              <Button type="button" variant="ghost" size="sm" className="text-red" onClick={() => onChange(null)}>
                <Trash2 className="h-4 w-4" /> Удалить
              </Button>
            ) : null}
          </div>
          <p className="text-[11px] text-muted-foreground">
            JPG, PNG или WebP до 8 МБ. Фото автоматически сжимается и попадёт на КП.
          </p>
        </div>
      </div>
    </div>
  )
}