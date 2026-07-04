import type { ReactNode } from 'react'

interface PageHeaderProps {
  title: string
  subtitle?: string
  action?: ReactNode
}

export function PageHeader({ title, subtitle, action }: PageHeaderProps) {
  return (
    <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0">
        <h1 className="text-3xl font-bold text-text-primary">{title}</h1>
        {subtitle ? <p className="mt-0.5 text-sm text-text-secondary">{subtitle}</p> : null}
      </div>

      {action ? <div className="shrink-0">{action}</div> : null}
    </header>
  )
}
