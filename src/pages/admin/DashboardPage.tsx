import { Clock, FolderKanban, Package, Search, ShoppingCart } from 'lucide-react'
import { useState } from 'react'
import type { ElementType, ReactNode } from 'react'

import { EmptyState } from '@/components/shared/EmptyState'
import { PageSkeleton } from '@/components/shared/PageSkeleton'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { Input } from '@/components/ui/input'
import { useAdminDashboardOverview } from '@/hooks/useAdmin'
import { useAdminRequestQueue } from '@/hooks/useAdmin'
import { useOrders } from '@/hooks/useOrders'
import { getErrorMessage } from '@/lib/errors'
import { cn } from '@/lib/utils'

interface StatCardProps {
  title: string
  value: number
  icon: ElementType
  tone?: 'neutral' | 'pending' | 'active'
}

function StatCard({ title, value, icon: Icon, tone = 'neutral' }: StatCardProps) {
  const toneClassName = {
    neutral: 'text-text-secondary',
    pending: 'text-amber-700',
    active: 'text-brand-700',
  }[tone]

  const iconSurfaceClassName = {
    neutral: 'bg-background',
    pending: 'bg-amber-50',
    active: 'bg-brand-50',
  }[tone]

  return (
    <article className="flex items-center justify-between gap-4 rounded-xl border border-border bg-surface-raised p-5 shadow-none">
      <div className="min-w-0 space-y-2">
        <p className="text-sm font-medium text-text-secondary leading-5 tracking-[0.28px]">{title}</p>
        <p className="text-3xl font-semibold leading-9 tabular-nums text-text-primary">{value}</p>
      </div>
      <div className={`flex size-10 shrink-0 items-center justify-center rounded-lg border border-border ${iconSurfaceClassName}`}>
        <Icon className={`size-5 ${toneClassName}`} aria-hidden="true" />
      </div>
    </article>
  )
}

interface DashboardListCardProps {
  title: string
  searchValue?: string
  searchPlaceholder?: string
  searchLabel?: string
  onSearchChange?: (value: string) => void
  summary?: ReactNode
  children: ReactNode
  className?: string
  bodyClassName?: string
}

function DashboardListCard({
  title,
  searchValue,
  searchPlaceholder = 'Search here...',
  searchLabel,
  onSearchChange,
  summary,
  children,
  className,
  bodyClassName,
}: DashboardListCardProps) {
  const hasSearch = searchValue !== undefined && onSearchChange !== undefined

  return (
    <section className={cn('overflow-hidden rounded-xl border border-border bg-surface-raised shadow-none', className)}>
      <div className="flex flex-col gap-3 border-b border-border px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-base font-semibold leading-6 tracking-[0.32px] text-text-primary">{title}</h2>
        {hasSearch ? (
          <div className="relative w-full sm:w-[200px]">
            <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-text-muted" aria-hidden="true" />
            <Input
              value={searchValue}
              onChange={(event) => onSearchChange(event.target.value)}
              placeholder={searchPlaceholder}
              aria-label={searchLabel ?? searchPlaceholder}
              className="h-9 bg-background pl-8 text-sm shadow-none"
            />
          </div>
        ) : null}
      </div>
      {summary ? <div className="border-b border-border px-4 py-3">{summary}</div> : null}
      <div className={cn('divide-y divide-border', bodyClassName)}>{children}</div>
    </section>
  )
}

interface EmptyListRowProps {
  title: string
  description: string
}

function EmptyListRow({ title, description }: EmptyListRowProps) {
  return (
    <div className="px-4 py-8">
      <EmptyState title={title} description={description} />
    </div>
  )
}

function ActivitySummaryPill({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-border bg-background px-3 py-2 shadow-none">
      <p className="text-xs font-[420] leading-[18px] tracking-[0.32px] text-text-muted">{label}</p>
      <p className="text-sm font-semibold leading-5 tabular-nums text-text-primary">{value}</p>
    </div>
  )
}

export function AdminDashboardPage() {
  const overviewQuery = useAdminDashboardOverview()
  const requestQueueQuery = useAdminRequestQueue({ status: 'PENDING', page: 1, limit: 5 })
  const ordersQuery = useOrders()
  const [requestSearch, setRequestSearch] = useState('')
  const [orderSearch, setOrderSearch] = useState('')
  const [activitySearch, setActivitySearch] = useState('')

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
  const requestSearchQuery = requestSearch.trim().toLowerCase()
  const filteredRequestQueue = requestSearchQuery
    ? requestQueue.filter((request) => {
        const searchable = [request.project.name, request.requester?.name ?? 'Unknown requester', `${request.items.length} items`, request.status]
          .join(' ')
          .toLowerCase()

        return searchable.includes(requestSearchQuery)
      })
    : requestQueue

  const recentOrders = orders.slice(0, 5)
  const orderSearchQuery = orderSearch.trim().toLowerCase()
  const filteredOrders = orderSearchQuery
    ? recentOrders.filter((order) => [`Order ${order.id}`, order.id, order.status].join(' ').toLowerCase().includes(orderSearchQuery))
    : recentOrders

  const activitySearchQuery = activitySearch.trim().toLowerCase()
  const filteredActivities = activitySearchQuery
    ? normalizedRecentActivities.filter((activity) => {
        const searchable = [
          activity.actionLabel,
          activity.performedByName,
          activity.requestedByName,
          activity.projectName,
          activity.requestId,
          activity.badgeStatus,
        ]
          .join(' ')
          .toLowerCase()

        return searchable.includes(activitySearchQuery)
      })
    : normalizedRecentActivities

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
        <StatCard title="Total products" value={overview?.products.total ?? 0} icon={Package} />
        <StatCard title="Pending requests" value={overview?.requests.byStatus.PENDING ?? 0} icon={Clock} tone="pending" />
        <StatCard title="Pending orders" value={overview?.orders.byStatus.PENDING ?? 0} icon={ShoppingCart} tone="pending" />
        <StatCard title="Active projects" value={overview?.projects.active ?? 0} icon={FolderKanban} tone="active" />
      </div>

      <div className="grid gap-[20px] lg:grid-cols-2">
        <DashboardListCard
          title="Request queue"
          searchValue={requestSearch}
          onSearchChange={setRequestSearch}
          searchPlaceholder="Search shown requests..."
          searchLabel="Search shown requests"
        >
          {requestQueue.length === 0 ? (
            <EmptyListRow title="No requests" description="No pending requests in the queue." />
          ) : filteredRequestQueue.length === 0 ? (
            <EmptyListRow title="No matching shown requests" description="Try another project, requester, or item count." />
          ) : (
            filteredRequestQueue.map((request) => (
              <article key={request.id} className="flex flex-wrap items-center gap-3 px-4 py-3 transition-colors hover:bg-surface">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium leading-5 tracking-[0.28px] text-text-primary">{request.project.name}</p>
                  <p className="text-xs font-[420] leading-[18px] tracking-[0.32px] text-text-secondary">
                    {request.requester?.name ?? 'Unknown requester'}
                  </p>
                </div>
                <span className="inline-flex items-center rounded-lg border border-border bg-background px-2 py-1 text-xs font-medium tabular-nums text-text-secondary">
                  {request.items.length} items
                </span>
                <div className="ml-auto">
                  <StatusBadge status={request.status} />
                </div>
              </article>
            ))
          )}
        </DashboardListCard>

        <DashboardListCard
          title="Recent orders"
          searchValue={orderSearch}
          onSearchChange={setOrderSearch}
          searchPlaceholder="Search recent orders..."
          searchLabel="Search recent orders"
        >
          {orders.length === 0 ? (
            <EmptyListRow title="No orders" description="Recent customer orders will appear here." />
          ) : filteredOrders.length === 0 ? (
            <EmptyListRow title="No matching recent orders" description="Try another order ID or status." />
          ) : (
            filteredOrders.map((order) => (
              <article key={order.id} className="flex flex-wrap items-center gap-3 px-4 py-3 transition-colors hover:bg-surface">
                <p className="min-w-0 truncate text-sm font-medium leading-5 tracking-[0.28px] text-text-primary">Order {order.id}</p>
                <div className="ml-auto">
                  <StatusBadge status={order.status} />
                </div>
              </article>
            ))
          )}
        </DashboardListCard>
      </div>

      <div className="grid gap-[20px] lg:grid-cols-2">
        <DashboardListCard
          title="Low stock alerts"
          className="flex h-[32rem] flex-col"
          bodyClassName="min-h-0 flex-1 overflow-y-auto"
        >
          {overview?.lowStockProducts?.length === 0 ? (
            <EmptyListRow title="Stock healthy" description="No products are currently in low-stock state." />
          ) : (
            overview?.lowStockProducts?.slice(0, 10).map((product) => (
              <article key={product.name} className="flex flex-wrap items-center gap-3 px-4 py-3 transition-colors hover:bg-surface">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium leading-5 tracking-[0.28px] text-text-primary">{product.name}</p>
                  <p className="text-xs font-[420] leading-[18px] tracking-[0.32px] text-text-secondary">Inventory exception</p>
                </div>
                <span className="ml-auto inline-flex items-center rounded-lg border border-amber-200 bg-amber-50 px-2 py-1 text-xs font-medium tabular-nums text-amber-700">
                  {product.currentAvailability} available
                </span>
              </article>
            ))
          )}
        </DashboardListCard>

        <DashboardListCard
          title="Activity feed"
          searchValue={activitySearch}
          onSearchChange={setActivitySearch}
          searchPlaceholder="Search activity..."
          searchLabel="Search activity feed"
          className="flex h-[32rem] flex-col"
          bodyClassName="min-h-0 flex-1 overflow-y-auto"
          summary={
            <div className="grid gap-2 sm:grid-cols-3">
              <ActivitySummaryPill label="Total" value={recentActivityTotal} />
              <ActivitySummaryPill label="Approvals" value={recentApprovals} />
              <ActivitySummaryPill label="Pickups" value={recentPickups} />
            </div>
          }
        >
          {normalizedRecentActivities.length === 0 ? (
            <EmptyListRow title="No recent activity" description="Recent approvals and pickups will appear here." />
          ) : filteredActivities.length === 0 ? (
            <EmptyListRow title="No matching activity" description="Try another actor, requester, project, or request number." />
          ) : (
            filteredActivities.map((activity) => (
              <article key={activity.id} className="px-4 py-3 transition-colors hover:bg-surface">
                <div className="flex flex-wrap items-center gap-3">
                  <p className="min-w-0 truncate text-sm font-medium leading-5 tracking-[0.28px] text-text-primary">{activity.actionLabel}</p>
                  <div className="ml-auto">
                    <StatusBadge status={activity.badgeStatus} />
                  </div>
                </div>
                <p className="mt-1 text-sm font-[420] leading-[21px] tracking-[0.28px] text-text-secondary">
                  {activity.performedByName} • for {activity.requestedByName} • {activity.projectName}
                </p>
                <div className="mt-1 flex flex-wrap items-center gap-2 text-xs font-[420] leading-[18px] tracking-[0.32px] text-text-muted">
                  <span className="tabular-nums">Request #{activity.requestId}</span>
                  <span aria-hidden="true">•</span>
                  <time dateTime={activity.occurredAt}>{new Date(activity.occurredAt).toLocaleString()}</time>
                </div>
              </article>
            ))
          )}
        </DashboardListCard>
      </div>
    </div>
  )
}
