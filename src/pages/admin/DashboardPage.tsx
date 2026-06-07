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
    <div className="space-y-[20px] font-sans">
      <header className="mb-[20px] flex items-start justify-between gap-4">
        <div>
          <h1 className="text-[26px] font-semibold text-[#383838] leading-[34px] tracking-[0.32px]">
            Admin Dashboard
          </h1>
          <p className="mt-1 text-[14px] font-[420] text-[#7c7c7c] leading-[21px] tracking-[0.28px]">
            System-level overview across operations
          </p>
        </div>
      </header>

      <div className="grid gap-[16px] sm:grid-cols-2 lg:grid-cols-4">
        <article className="rounded-[12px] border border-[#ededed] bg-[#ffffff] p-[20px] shadow-none">
          <p className="text-[12px] font-medium uppercase tracking-[0.32px] text-[#7c7c7c]">Total products</p>
          <p className="mt-2 text-[30px] font-semibold text-[#383838] leading-[36px]">{overview?.products.total ?? 0}</p>
        </article>
        <article className="rounded-[12px] border border-[#ededed] bg-[#ffffff] p-[20px] shadow-none">
          <p className="text-[12px] font-medium uppercase tracking-[0.32px] text-[#7c7c7c]">Pending requests</p>
          <p className="mt-2 text-[30px] font-semibold text-[#383838] leading-[36px]">{overview?.requests.byStatus.PENDING ?? 0}</p>
        </article>
        <article className="rounded-[12px] border border-[#ededed] bg-[#ffffff] p-[20px] shadow-none">
          <p className="text-[12px] font-medium uppercase tracking-[0.32px] text-[#7c7c7c]">Pending orders</p>
          <p className="mt-2 text-[30px] font-semibold text-[#383838] leading-[36px]">{overview?.orders.byStatus.PENDING ?? 0}</p>
        </article>
        <article className="rounded-[12px] border border-[#ededed] bg-[#ffffff] p-[20px] shadow-none">
          <p className="text-[12px] font-medium uppercase tracking-[0.32px] text-[#7c7c7c]">Active projects</p>
          <p className="mt-2 text-[30px] font-semibold text-[#383838] leading-[36px]">{overview?.projects.active ?? 0}</p>
        </article>
      </div>

      <div className="grid gap-[20px] lg:grid-cols-2">
        <section className="rounded-[12px] border border-[#ededed] bg-[#ffffff] p-[20px] shadow-none">
          <h2 className="text-[18px] font-semibold text-[#383838] leading-[27px] tracking-[0.32px]">Request queue</h2>
          {requestQueue.length === 0 ? (
            <EmptyState title="No requests" description="No pending requests in the queue." />
          ) : (
            <div className="mt-4 space-y-[10px]">
              {requestQueue.map((request) => (
                <article key={request.id} className="rounded-[8px] border border-[#ededed] bg-[#ffffff] p-3 shadow-none">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-[16px] font-[420] text-[#383838] leading-[24px] tracking-[0.32px]">{request.project.name}</p>
                      <p className="text-[14px] font-[420] text-[#525252] leading-[21px] tracking-[0.28px]">
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

        <section className="rounded-[12px] border border-[#ededed] bg-[#ffffff] p-[20px] shadow-none">
          <h2 className="text-[18px] font-semibold text-[#383838] leading-[27px] tracking-[0.32px]">Recent orders</h2>
          {orders.length === 0 ? (
            <EmptyState title="No orders" description="Recent customer orders will appear here." />
          ) : (
            <div className="mt-4 space-y-[10px]">
              {orders.slice(0, 5).map((order) => (
                <article key={order.id} className="rounded-[8px] border border-[#ededed] bg-[#ffffff] p-3 shadow-none">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-[16px] font-[420] text-[#383838] leading-[24px] tracking-[0.32px]">Order {order.id}</p>
                    <StatusBadge status={order.status} />
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>

      <div className="grid gap-[20px] lg:grid-cols-2">
        <section className="rounded-[12px] border border-[#ededed] bg-[#ffffff] p-[20px] shadow-none">
          <h2 className="text-[18px] font-semibold text-[#383838] leading-[27px] tracking-[0.32px]">Low stock alerts</h2>
          {overview?.lowStockProducts?.length === 0 ? (
            <EmptyState title="Stock healthy" description="No products are currently in low-stock state." />
          ) : (
            <div className="mt-4 space-y-[10px]">
              {overview?.lowStockProducts?.slice(0, 10).map((product) => (
                <article key={product.name} className="rounded-[8px] border border-[#ededed] bg-[#ffffff] p-3 shadow-none">
                  <p className="text-[16px] font-[420] text-[#383838] leading-[24px] tracking-[0.32px]">{product.name}</p>
                  <p className="text-[14px] font-[420] text-[#525252] leading-[21px] tracking-[0.28px]">{product.currentAvailability} available</p>
                </article>
              ))}
            </div>
          )}
        </section>

        <section className="flex h-[32rem] flex-col rounded-[12px] border border-[#ededed] bg-[#ffffff] p-[20px] shadow-none">
          <h2 className="text-[18px] font-semibold text-[#383838] leading-[27px] tracking-[0.32px]">Activity feed</h2>
          <div className="mt-3 grid gap-2 sm:grid-cols-3">
            <div className="rounded-[8px] border border-[#ededed] bg-[#ffffff] px-3 py-2 shadow-none">
              <p className="text-[12px] font-[420] text-[#7c7c7c] leading-[18px] tracking-[0.32px]">Total</p>
              <p className="text-[14px] font-semibold text-[#383838] leading-[20px]">{recentActivityTotal}</p>
            </div>
            <div className="rounded-[8px] border border-[#ededed] bg-[#ffffff] px-3 py-2 shadow-none">
              <p className="text-[12px] font-[420] text-[#7c7c7c] leading-[18px] tracking-[0.32px]">Approvals</p>
              <p className="text-[14px] font-semibold text-[#383838] leading-[20px]">{recentApprovals}</p>
            </div>
            <div className="rounded-[8px] border border-[#ededed] bg-[#ffffff] px-3 py-2 shadow-none">
              <p className="text-[12px] font-[420] text-[#7c7c7c] leading-[18px] tracking-[0.32px]">Pickups</p>
              <p className="text-[14px] font-semibold text-[#383838] leading-[20px]">{recentPickups}</p>
            </div>
          </div>

          <div className="mt-4 min-h-0 flex-1 overflow-y-auto pr-1">
            {normalizedRecentActivities.length === 0 ? (
              <EmptyState title="No recent activity" description="Recent approvals and pickups will appear here." />
            ) : (
              <div className="space-y-[10px]">
                {normalizedRecentActivities.map((activity) => (
                  <article key={activity.id} className="rounded-[8px] border border-[#ededed] bg-[#ffffff] p-3 shadow-none">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-[16px] font-[420] text-[#383838] leading-[24px] tracking-[0.32px]">{activity.actionLabel}</p>
                      <StatusBadge status={activity.badgeStatus} />
                    </div>
                    <p className="mt-1 text-[14px] font-[420] text-[#525252] leading-[21px] tracking-[0.28px]">
                      {activity.performedByName} • for {activity.requestedByName} • {activity.projectName}
                    </p>
                    <p className="mt-1 text-[12px] font-[420] text-[#7c7c7c] leading-[18px] tracking-[0.32px]">Request #{activity.requestId}</p>
                    <p className="mt-1 text-[12px] font-[420] text-[#7c7c7c] leading-[18px] tracking-[0.32px]">
                      {new Date(activity.occurredAt).toLocaleString()}
                    </p>
                  </article>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  )
}
