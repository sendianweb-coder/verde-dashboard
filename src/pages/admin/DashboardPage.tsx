import { PageHeader } from '@/components/layout/PageHeader'
import { EmptyState } from '@/components/shared/EmptyState'
import { PageSkeleton } from '@/components/shared/PageSkeleton'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { useAdminDashboardOverview } from '@/hooks/useAdmin'
import { useAdminRequestQueue } from '@/hooks/useAdmin'
import { useOrders } from '@/hooks/useOrders'
import { getErrorMessage } from '@/lib/errors'

export function AdminDashboardPage() {
  const overviewQuery = useAdminDashboardOverview()
  const requestQueueQuery = useAdminRequestQueue({ status: 'PENDING', page: 1, limit: 5 })
  const ordersQuery = useOrders()

  if (overviewQuery.isLoading || requestQueueQuery.isLoading || ordersQuery.isLoading) {
    return <PageSkeleton />
  }

  if (overviewQuery.isError || requestQueueQuery.isError || ordersQuery.isError) {
    return (
      <EmptyState
        title="Unable to load dashboard"
        description={getErrorMessage(overviewQuery.error ?? requestQueueQuery.error ?? ordersQuery.error, { context: 'load' })}
      />
    )
  }

  const overview = overviewQuery.data
  const requestQueue = requestQueueQuery.data?.data ?? []
  const orders = ordersQuery.data ?? []
  const recentActivities = overview?.recentActivities.items ?? []
  const recentActivityTotal = overview?.recentActivities.total ?? 0
  const recentApprovals = recentActivities.filter((activity) => activity.event === 'approved').length
  const recentPickups = recentActivities.filter((activity) => activity.event === 'pickedUp').length
  const normalizedRecentActivities = recentActivities
    .map((activity, index) => ({
      id: `${activity.at}-${activity.requestId}-${activity.event}-${index}`,
      actionLabel: activity.event === 'pickedUp' ? 'Request picked up' : 'Request approved',
      badgeStatus: activity.event === 'pickedUp' ? 'PICKED_UP' : 'APPROVED',
      occurredAt: activity.at,
      performedByName: activity.performedBy || 'Unknown actor',
      requestedByName: activity.requestedBy || 'Unknown requester',
      projectName: activity.projectName || 'Unknown project',
      requestId: activity.requestId || 'Unknown',
    }))
    .filter((activity): activity is NonNullable<typeof activity> => activity !== null)

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

        <section className="flex h-[32rem] flex-col rounded-xl border border-border bg-surface-raised p-5">
          <h2 className="text-lg font-semibold text-text-primary">Activity feed</h2>
          <div className="mt-3 grid gap-2 sm:grid-cols-3">
            <div className="rounded-lg border border-border bg-background px-3 py-2">
              <p className="text-xs text-text-secondary">Total</p>
              <p className="text-sm font-semibold text-text-primary">{recentActivityTotal}</p>
            </div>
            <div className="rounded-lg border border-border bg-background px-3 py-2">
              <p className="text-xs text-text-secondary">Approvals</p>
              <p className="text-sm font-semibold text-text-primary">{recentApprovals}</p>
            </div>
            <div className="rounded-lg border border-border bg-background px-3 py-2">
              <p className="text-xs text-text-secondary">Pickups</p>
              <p className="text-sm font-semibold text-text-primary">{recentPickups}</p>
            </div>
          </div>

          <div className="mt-4 min-h-0 flex-1 overflow-y-auto pr-1">
            {normalizedRecentActivities.length === 0 ? (
              <EmptyState title="No recent activity" description="Recent approvals and pickups will appear here." />
            ) : (
              <div className="space-y-2">
                {normalizedRecentActivities.map((activity) => (
                  <article key={activity.id} className="rounded-lg border border-border bg-background p-3">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-medium text-text-primary">{activity.actionLabel}</p>
                      <StatusBadge status={activity.badgeStatus} />
                    </div>
                    <p className="mt-1 text-xs text-text-secondary">{activity.performedByName} • for {activity.requestedByName} • {activity.projectName}</p>
                    <p className="mt-1 text-xs text-text-secondary">Request #{activity.requestId}</p>
                    <p className="mt-1 text-xs text-text-muted">{new Date(activity.occurredAt).toLocaleString()}</p>
                  </article>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>
    </section>
  )
}
