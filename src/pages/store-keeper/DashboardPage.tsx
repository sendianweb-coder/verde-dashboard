import { PageHeader } from '@/components/layout/PageHeader'
import { EmptyState } from '@/components/shared/EmptyState'
import { PageSkeleton } from '@/components/shared/PageSkeleton'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { StockIndicator } from '@/components/shared/StockIndicator'
import { useProducts } from '@/hooks/useProducts'
import { useRequests } from '@/hooks/useRequests'
import { getErrorMessage } from '@/lib/errors'

export function StoreKeeperDashboardPage() {
  const requestsQuery = useRequests()
  const productsQuery = useProducts()

  if (requestsQuery.isLoading || productsQuery.isLoading) {
    return <PageSkeleton />
  }

  if (requestsQuery.isError || productsQuery.isError) {
    return <EmptyState title="Unable to load dashboard" description={getErrorMessage(requestsQuery.error ?? productsQuery.error, { context: 'load' })} />
  }

  const requests = requestsQuery.data ?? []
  const products = productsQuery.data ?? []

  const pendingRequests = requests.filter((request) => request.status === 'PENDING')
  const approvedTodayCount = requests.filter((request) => {
    const isApproved = request.status === 'APPROVED'
    const requestDate = new Date(request.updatedAt).toDateString()
    return isApproved && requestDate === new Date().toDateString()
  }).length

  const pickedUpTodayCount = requests.filter((request) => {
    const isPickedUp = request.status === 'PICKED_UP'
    const requestDate = new Date(request.updatedAt).toDateString()
    return isPickedUp && requestDate === new Date().toDateString()
  }).length

  const lowStockProducts = products.filter((product) => {
    if (product.stockQuantity <= 0) {
      return false
    }
    return product.availableQuantity / product.stockQuantity <= 0.2
  })

  return (
    <section className="space-y-6">
      <PageHeader title="Store Keeper Dashboard" subtitle="Monitor pending requests and stock health in real time" />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <article className="rounded-xl border border-border bg-surface-raised p-5">
          <p className="text-sm text-text-secondary">Pending requests</p>
          <p className="mt-2 text-3xl font-bold text-text-primary">{pendingRequests.length}</p>
        </article>
        <article className="rounded-xl border border-border bg-surface-raised p-5">
          <p className="text-sm text-text-secondary">Approved today</p>
          <p className="mt-2 text-3xl font-bold text-text-primary">{approvedTodayCount}</p>
        </article>
        <article className="rounded-xl border border-border bg-surface-raised p-5">
          <p className="text-sm text-text-secondary">Picked up today</p>
          <p className="mt-2 text-3xl font-bold text-text-primary">{pickedUpTodayCount}</p>
        </article>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-xl border border-border bg-surface-raised p-5">
          <h2 className="text-lg font-semibold text-text-primary">Live pending requests</h2>
          {pendingRequests.length === 0 ? (
            <EmptyState title="No pending requests" description="Incoming requests will appear here instantly." />
          ) : (
            <div className="mt-4 space-y-3">
              {pendingRequests.slice(0, 8).map((request) => (
                <article key={request.id} className="rounded-lg border border-border bg-background p-3">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-medium text-text-primary">{request.project.name}</p>
                    <StatusBadge status={request.status} />
                  </div>
                  <p className="mt-1 text-xs text-text-secondary">{request.requester?.name ?? 'Employee'} - {request.items.length} items</p>
                </article>
              ))}
            </div>
          )}
        </section>

        <section className="rounded-xl border border-border bg-surface-raised p-5">
          <h2 className="text-lg font-semibold text-text-primary">Low stock warnings</h2>
          {lowStockProducts.length === 0 ? (
            <EmptyState title="Stock healthy" description="No products are below the low-stock threshold." />
          ) : (
            <div className="mt-4 space-y-3">
              {lowStockProducts.slice(0, 8).map((product) => (
                <article key={product.id} className="flex items-center justify-between gap-3 rounded-lg border border-border bg-background p-3">
                  <div>
                    <p className="text-sm font-medium text-text-primary">{product.name}</p>
                    <p className="text-xs text-text-secondary">
                      {product.availableQuantity}/{product.stockQuantity} available
                    </p>
                  </div>
                  <StockIndicator availableQuantity={product.availableQuantity} totalQuantity={product.stockQuantity} />
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </section>
  )
}
