import type { ReactNode } from 'react'

interface PageHeaderProps {
  title: string
  subtitle?: string
  action?: ReactNode
}

export function PageHeader({ title, subtitle, action }: PageHeaderProps) {
  return (
    <header className="mb-6 flex items-start justify-between gap-4 rounded-xl border border-border bg-surface-raised p-5 shadow-sm">
      <div>
        <h1 className="font-heading text-3xl font-bold text-text-primary">{title}</h1>
        {subtitle ? <p className="mt-1 text-sm text-text-secondary">{subtitle}</p> : null}
      </div>

      {action ? <div className="shrink-0">{action}</div> : null}
    </header>
  )
}
