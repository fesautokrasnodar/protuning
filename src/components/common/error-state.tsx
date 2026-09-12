import { AlertTriangle, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface ErrorStateProps {
  title?: string
  message?: string
  onRetry?: () => void
}

export function ErrorState({
  title = 'Не удалось загрузить данные',
  message,
  onRetry,
}: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-red/30 bg-red-soft px-6 py-14 text-center">
      <AlertTriangle className="h-8 w-8 text-red" />
      <h3 className="text-base font-black text-ink">{title}</h3>
      {message ? <p className="max-w-md text-sm text-muted-foreground">{message}</p> : null}
      {onRetry ? (
        <Button variant="outline" onClick={onRetry} className="mt-1">
          <RefreshCw className="h-4 w-4" /> Повторить
        </Button>
      ) : null}
    </div>
  )
}