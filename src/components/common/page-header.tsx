import type { ReactNode } from 'react'

interface PageHeaderProps {
  kicker: string
  title: string
  description?: string
  actions?: ReactNode
}

export function PageHeader({ kicker, title, description, actions }: PageHeaderProps) {
  return (
    <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <div>
        <div className="kicker mb-1 text-[11px] font-black uppercase tracking-[0.14em] text-red">{kicker}</div>
        <h1 className="text-2xl font-black tracking-tight text-ink">{title}</h1>
        {description ? <p className="mt-1 text-sm text-muted-foreground">{description}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  )
}