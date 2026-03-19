interface PageHeaderProps {
  title: string
  subtitle?: string
}

export function PageHeader({ title, subtitle }: PageHeaderProps) {
  return (
    <header className="mb-6 rounded-xl border border-border bg-surface-raised p-5 shadow-sm">
      <h1 className="font-heading text-3xl font-bold text-text-primary">{title}</h1>
      {subtitle ? <p className="mt-1 text-sm text-text-secondary">{subtitle}</p> : null}
    </header>
  )
}
