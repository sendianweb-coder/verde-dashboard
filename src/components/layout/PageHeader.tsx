interface PageHeaderProps {
  title: string
  subtitle?: string
}

export function PageHeader({ title, subtitle }: PageHeaderProps) {
  return (
    <header className="mb-6 rounded-xl border border-emerald-100 bg-white/85 p-5 shadow-sm backdrop-blur">
      <h1 className="font-[var(--font-heading)] text-2xl text-slate-900">{title}</h1>
      {subtitle ? <p className="mt-1 text-sm text-slate-600">{subtitle}</p> : null}
    </header>
  )
}
