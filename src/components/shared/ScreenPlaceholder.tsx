import { PageHeader } from '@/components/layout/PageHeader'
import { EmptyState } from '@/components/shared/EmptyState'

interface ScreenPlaceholderProps {
  title: string
  description: string
}

export function ScreenPlaceholder({ title, description }: ScreenPlaceholderProps) {
  return (
    <section>
      <PageHeader title={title} subtitle="MVP scaffold ready for implementation" />
      <EmptyState title="Screen scaffolded" description={description} />
    </section>
  )
}
