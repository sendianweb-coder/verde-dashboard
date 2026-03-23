import { PageHeader } from '@/components/layout/PageHeader'
import { EmptyState } from '@/components/shared/EmptyState'
import { PageSkeleton } from '@/components/shared/PageSkeleton'
import { QuickRequestDialog } from '@/components/shared/QuickRequestDialog'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { useMyRequests } from '@/hooks/useRequests'

export function EmployeeDashboardPage() {
  const myRequestsQuery = useMyRequests()

  if (myRequestsQuery.isLoading) {
    return <PageSkeleton />
  }

  const requests = myRequestsQuery.data ?? []
  const currentMonth = new Date().getMonth()
  const currentYear = new Date().getFullYear()

  const thisMonthRequests = requests.filter((request) => {
    const createdAt = new Date(request.createdAt)
    return createdAt.getMonth() === currentMonth && createdAt.getFullYear() === currentYear
  })

  const pendingCount = thisMonthRequests.filter((request) => request.status === 'PENDING').length
  const approvedCount = thisMonthRequests.filter((request) => request.status === 'APPROVED').length
  const completedCount = thisMonthRequests.filter((request) => request.status === 'COMPLETED').length

  const activeRequests = requests.filter((request) => request.status === 'PENDING' || request.status === 'APPROVED').slice(0, 6)
  const recentCompletedRequests = requests.filter((request) => request.status === 'COMPLETED').slice(0, 5)

  return (
    <section className="space-y-6">
      <PageHeader
        title="Employee Dashboard"
        subtitle="Track your requests and create new material requests"
        action={<QuickRequestDialog />}
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <article className="rounded-xl border border-border bg-surface-raised p-5">
          <p className="text-sm text-text-secondary">Requests this month</p>
          <p className="mt-2 text-3xl font-bold text-text-primary">{thisMonthRequests.length}</p>
        </article>
        <article className="rounded-xl border border-border bg-surface-raised p-5">
          <p className="text-sm text-text-secondary">Pending</p>
          <p className="mt-2 text-3xl font-bold text-text-primary">{pendingCount}</p>
        </article>
        <article className="rounded-xl border border-border bg-surface-raised p-5">
          <p className="text-sm text-text-secondary">Approved</p>
          <p className="mt-2 text-3xl font-bold text-text-primary">{approvedCount}</p>
        </article>
        <article className="rounded-xl border border-border bg-surface-raised p-5">
          <p className="text-sm text-text-secondary">Completed</p>
          <p className="mt-2 text-3xl font-bold text-text-primary">{completedCount}</p>
        </article>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-xl border border-border bg-surface-raised p-5">
          <h2 className="text-lg font-semibold text-text-primary">Active requests</h2>
          {activeRequests.length === 0 ? (
            <EmptyState title="No active requests" description="You currently have no pending or approved requests." />
          ) : (
            <div className="mt-4 space-y-3">
              {activeRequests.map((request) => (
                <article key={request.id} className="rounded-lg border border-border bg-background p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium text-text-primary">{request.project.name}</p>
                      <p className="text-xs text-text-secondary">{request.items.length} items</p>
                    </div>
                    <StatusBadge status={request.status} />
                  </div>
                  <p className="mt-2 text-xs text-text-muted">Submitted {new Date(request.createdAt).toLocaleDateString()}</p>
                </article>
              ))}
            </div>
          )}
        </section>

        <section className="rounded-xl border border-border bg-surface-raised p-5">
          <h2 className="text-lg font-semibold text-text-primary">Recent history</h2>
          {recentCompletedRequests.length === 0 ? (
            <EmptyState title="No completed requests" description="Completed requests will appear here once fulfilled." />
          ) : (
            <div className="mt-4 space-y-3">
              {recentCompletedRequests.map((request) => (
                <article key={request.id} className="rounded-lg border border-border bg-background p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium text-text-primary">{request.project.name}</p>
                      <p className="text-xs text-text-secondary">{request.items.length} items</p>
                    </div>
                    <StatusBadge status={request.status} />
                  </div>
                  <p className="mt-2 text-xs text-text-muted">Completed {new Date(request.updatedAt).toLocaleDateString()}</p>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </section>
  )
}
