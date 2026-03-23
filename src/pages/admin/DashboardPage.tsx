import { PageHeader } from '@/components/layout/PageHeader'
import { EmptyState } from '@/components/shared/EmptyState'
import { PageSkeleton } from '@/components/shared/PageSkeleton'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { useAuditLog } from '@/hooks/useAuditLog'
import { useOrders } from '@/hooks/useOrders'
import { useProducts } from '@/hooks/useProducts'
import { useRequests } from '@/hooks/useRequests'
import { useUsers } from '@/hooks/useUsers'

export function AdminDashboardPage() {
  const usersQuery = useUsers()
  const productsQuery = useProducts()
  const requestsQuery = useRequests()
  const ordersQuery = useOrders()
  const auditLogQuery = useAuditLog({ page: 1, limit: 10 })

  if (usersQuery.isLoading || productsQuery.isLoading || requestsQuery.isLoading || ordersQuery.isLoading || auditLogQuery.isLoading) {
    return <PageSkeleton />
  }

  const users = usersQuery.data ?? []
  const products = productsQuery.data ?? []
  const requests = requestsQuery.data ?? []
  const orders = ordersQuery.data ?? []
  const auditEntries = auditLogQuery.data?.data ?? []

  const lowStockProducts = products.filter((product) => product.stockQuantity > 0 && product.availableQuantity / product.stockQuantity <= 0.2)

  return (
    <section className="space-y-6">
      <PageHeader title="Admin Dashboard" subtitle="System-level overview across operations" />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <article className="rounded-xl border border-border bg-surface-raised p-5">
          <p className="text-sm text-text-secondary">Total products</p>
          <p className="mt-2 text-3xl font-bold text-text-primary">{products.length}</p>
        </article>
        <article className="rounded-xl border border-border bg-surface-raised p-5">
          <p className="text-sm text-text-secondary">Active requests</p>
          <p className="mt-2 text-3xl font-bold text-text-primary">{requests.filter((request) => request.status !== 'COMPLETED').length}</p>
        </article>
        <article className="rounded-xl border border-border bg-surface-raised p-5">
          <p className="text-sm text-text-secondary">Pending orders</p>
          <p className="mt-2 text-3xl font-bold text-text-primary">{orders.filter((order) => order.status === 'PENDING').length}</p>
        </article>
        <article className="rounded-xl border border-border bg-surface-raised p-5">
          <p className="text-sm text-text-secondary">Total users</p>
          <p className="mt-2 text-3xl font-bold text-text-primary">{users.length}</p>
        </article>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-xl border border-border bg-surface-raised p-5">
          <h2 className="text-lg font-semibold text-text-primary">Recent requests</h2>
          {(requests.length === 0) ? (
            <EmptyState title="No requests" description="Recent internal requests will appear here." />
          ) : (
            <div className="mt-4 space-y-3">
              {requests.slice(0, 5).map((request) => (
                <article key={request.id} className="rounded-lg border border-border bg-background p-3">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-medium text-text-primary">{request.project.name}</p>
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
          {lowStockProducts.length === 0 ? (
            <EmptyState title="Stock healthy" description="No products are currently in low-stock state." />
          ) : (
            <div className="mt-4 space-y-2">
              {lowStockProducts.slice(0, 10).map((product) => (
                <article key={product.id} className="rounded-lg border border-border bg-background p-3">
                  <p className="text-sm font-medium text-text-primary">{product.name}</p>
                  <p className="text-xs text-text-secondary">{product.availableQuantity}/{product.stockQuantity} available</p>
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
