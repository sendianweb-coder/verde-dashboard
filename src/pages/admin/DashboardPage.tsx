import { PageHeader } from '@/components/layout/PageHeader'
import { EmptyState } from '@/components/shared/EmptyState'
import { PageSkeleton } from '@/components/shared/PageSkeleton'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { useAdminDashboardOverview } from '@/hooks/useAdmin'
import { useAdminRequestQueue } from '@/hooks/useAdmin'
import { useAuditLog } from '@/hooks/useAuditLog'
import { useOrders } from '@/hooks/useOrders'
import { getErrorMessage } from '@/lib/errors'

export function AdminDashboardPage() {
  const overviewQuery = useAdminDashboardOverview()
  const requestQueueQuery = useAdminRequestQueue({ status: 'PENDING', page: 1, limit: 5 })
  const ordersQuery = useOrders()
  const auditLogQuery = useAuditLog({ page: 1, limit: 6 })

  if (overviewQuery.isLoading || requestQueueQuery.isLoading || ordersQuery.isLoading || auditLogQuery.isLoading) {
    return <PageSkeleton />
  }

  if (overviewQuery.isError || requestQueueQuery.isError || ordersQuery.isError || auditLogQuery.isError) {
    return (
      <EmptyState
        title="Unable to load dashboard"
        description={getErrorMessage(overviewQuery.error ?? requestQueueQuery.error ?? ordersQuery.error ?? auditLogQuery.error, { context: 'load' })}
      />
    )
  }

  const overview = overviewQuery.data
  const requestQueue = requestQueueQuery.data?.data ?? []
  const orders = ordersQuery.data ?? []
  const auditEntries = auditLogQuery.data?.data ?? []

  return (
    <section className="space-y-6">
      <PageHeader title="Admin Dashboard" subtitle="System-level overview across operations" />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <article className="rounded-xl border border-border bg-surface-raised p-5">
          <p className="text-sm text-text-secondary">Total products</p>
          <p className="mt-2 text-3xl font-bold text-text-primary">{overview?.products.total ?? 0}</p>
        </article>
        <article className="rounded-xl border border-border bg-surface-raised p-5">
          <p className="text-sm text-text-secondary">Pending requests</p>
          <p className="mt-2 text-3xl font-bold text-text-primary">{overview?.requests.byStatus.PENDING ?? 0}</p>
        </article>
        <article className="rounded-xl border border-border bg-surface-raised p-5">
          <p className="text-sm text-text-secondary">Pending orders</p>
          <p className="mt-2 text-3xl font-bold text-text-primary">{overview?.orders.byStatus.PENDING ?? 0}</p>
        </article>
        <article className="rounded-xl border border-border bg-surface-raised p-5">
          <p className="text-sm text-text-secondary">Active projects</p>
          <p className="mt-2 text-3xl font-bold text-text-primary">{overview?.projects.active ?? 0}</p>
        </article>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-xl border border-border bg-surface-raised p-5">
          <h2 className="text-lg font-semibold text-text-primary">Request queue</h2>
          {(requestQueue.length === 0) ? (
            <EmptyState title="No requests" description="No pending requests in the queue." />
          ) : (
            <div className="mt-4 space-y-3">
              {requestQueue.map((request) => (
                <article key={request.id} className="rounded-lg border border-border bg-background p-3">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium text-text-primary">{request.project.name}</p>
                      <p className="text-xs text-text-secondary">
                        {request.requester?.name ?? 'Unknown requester'} • {request.items.length} items
                      </p>
                    </div>
                    <StatusBadge status={request.status} />
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        <section className="rounded-xl border border-border bg-surface-raised p-5">
          <h2 className="text-lg font-semibold text-text-primary">Recent orders</h2>
          {(orders.length === 0) ? (
            <EmptyState title="No orders" description="Recent customer orders will appear here." />
          ) : (
            <div className="mt-4 space-y-3">
              {orders.slice(0, 5).map((order) => (
                <article key={order.id} className="rounded-lg border border-border bg-background p-3">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-medium text-text-primary">Order {order.id}</p>
                    <StatusBadge status={order.status} />
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-xl border border-border bg-surface-raised p-5">
          <h2 className="text-lg font-semibold text-text-primary">Low stock alerts</h2>
          {overview?.lowStockProducts?.length === 0 ? (
            <EmptyState title="Stock healthy" description="No products are currently in low-stock state." />
          ) : (
            <div className="mt-4 space-y-2">
              {overview?.lowStockProducts?.slice(0, 10).map((product) => (
                <article key={product.name} className="rounded-lg border border-border bg-background p-3">
                  <p className="text-sm font-medium text-text-primary">{product.name}</p>
                  <p className="text-xs text-text-secondary">{product.currentAvailability} available</p>
                </article>
              ))}
            </div>
          )}
        </section>

        <section className="rounded-xl border border-border bg-surface-raised p-5">
          <h2 className="text-lg font-semibold text-text-primary">Activity feed</h2>
          {auditEntries.length === 0 ? (
            <EmptyState title="No audit entries" description="Recent system actions will appear here." />
          ) : (
            <div className="mt-4 space-y-2">
              {auditEntries.map((entry) => (
                <article key={entry.id} className="rounded-lg border border-border bg-background p-3">
                  <p className="text-sm font-medium text-text-primary">{entry.action}</p>
                  <p className="text-xs text-text-secondary">{entry.entity} #{entry.entityId}</p>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </section>
  )
}
