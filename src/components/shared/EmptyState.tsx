interface EmptyStateProps {
  title: string
  description: string
}

export function EmptyState({ title, description }: EmptyStateProps) {
  return (
    <div className="rounded-xl border border-dashed border-slate-300 bg-white/70 p-8 text-center">
      <h3 className="font-[var(--font-heading)] text-xl text-slate-900">{title}</h3>
      <p className="mt-2 text-sm text-slate-600">{description}</p>
    </div>
  )
}
