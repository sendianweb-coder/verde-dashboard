import { ClipboardList, Package, PackageCheck } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

import { PageHeader } from '@/components/layout/PageHeader'
import { EmptyState } from '@/components/shared/EmptyState'
import { PageSkeleton } from '@/components/shared/PageSkeleton'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { StockIndicator } from '@/components/shared/StockIndicator'
import { Button } from '@/components/ui/button'
import { useProducts } from '@/hooks/useProducts'
import { useRequests } from '@/hooks/useRequests'
import { getErrorMessage } from '@/lib/errors'
import type { InternalRequest, RequestStatus } from '@/types/request'

const dateFormatter = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' })

function formatDate(value: string) {
  return dateFormatter.format(new Date(value))
}

function getInitials(name: string) {
  return name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

function getRequestActionDate(request: InternalRequest, action: RequestStatus) {
  return [...(request.history ?? [])].reverse().find((event) => event.action === action)?.createdAt ?? request.createdAt
}

export function StoreKeeperDashboardPage() {
  const navigate = useNavigate()
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
    const requestDate = new Date(getRequestActionDate(request, 'APPROVED')).toDateString()
    return isApproved && requestDate === new Date().toDateString()
  }).length

  const pickedUpTodayCount = requests.filter((request) => {
    const isPickedUp = request.status === 'PICKED_UP'
    const requestDate = new Date(getRequestActionDate(request, 'PICKED_UP')).toDateString()
    return isPickedUp && requestDate === new Date().toDateString()
  }).length

  const lowStockProducts = products.filter((product) => {
    if (product.totalQuantity <= 0) {
      return false
    }
    return product.availableQuantity / product.totalQuantity <= 0.2
  })

  return (
    <section className="space-y-6">
      <PageHeader title="Store Keeper Dashboard" subtitle="Monitor pending requests and stock health in real time" />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <article className="rounded-xl border border-border bg-surface-raised p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-text-secondary">Pending requests</p>
              <p className="mt-2 text-3xl font-bold tabular-nums text-text-primary">{pendingRequests.length}</p>
            </div>
            <span className="flex size-9 items-center justify-center rounded-lg border border-border bg-surface text-brand-600">
              <ClipboardList className="size-4" />
            </span>
          </div>
        </article>
        <article className="rounded-xl border border-border bg-surface-raised p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-text-secondary">Approved today</p>
              <p className="mt-2 text-3xl font-bold tabular-nums text-text-primary">{approvedTodayCount}</p>
            </div>
            <span className="flex size-9 items-center justify-center rounded-lg border border-border bg-surface text-brand-600">
              <PackageCheck className="size-4" />
            </span>
          </div>
        </article>
        <article className="rounded-xl border border-border bg-surface-raised p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-text-secondary">Picked up today</p>
              <p className="mt-2 text-3xl font-bold tabular-nums text-text-primary">{pickedUpTodayCount}</p>
            </div>
            <span className="flex size-9 items-center justify-center rounded-lg border border-border bg-surface text-text-muted">
              <Package className="size-4" />
            </span>
          </div>
        </article>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="overflow-hidden rounded-xl border border-border bg-surface-raised">
          <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
            <div>
              <h2 className="text-base font-medium text-text-primary">Live pending requests</h2>
              <p className="mt-0.5 text-sm text-text-secondary">Newest request records needing action.</p>
            </div>
            <Button type="button" variant="secondary" size="sm" onClick={() => navigate('/store-keeper/requests')}>
              View queue
            </Button>
          </div>
          {pendingRequests.length === 0 ? (
            <EmptyState title="No pending requests" description="Incoming requests will appear here instantly." />
          ) : (
            <div className="divide-y divide-border">
              {pendingRequests.slice(0, 8).map((request) => (
                <button
                  key={request.id}
                  type="button"
                  className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition-colors hover:bg-surface"
                  onClick={() => navigate(`/store-keeper/requests/${request.id}`)}
                >
                  <div className="flex min-w-0 items-center gap-2.5">
                    <span className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-border bg-surface text-xs font-semibold text-text-secondary">
                      {getInitials(request.requester.name)}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-text-primary">{request.project.name}</p>
                      <p className="text-xs text-text-muted">
                        {request.requester.name} &middot; {request.summary?.itemCount ?? request.items.length} items &middot; {formatDate(request.createdAt)}
                      </p>
                    </div>
                  </div>
                  <StatusBadge status={request.status} />
                </button>
              ))}
            </div>
          )}
        </section>

        <section className="overflow-hidden rounded-xl border border-border bg-surface-raised">
          <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
            <div>
              <h2 className="text-base font-medium text-text-primary">Low stock warnings</h2>
              <p className="mt-0.5 text-sm text-text-secondary">Products below the stock health threshold.</p>
            </div>
            <Button type="button" variant="secondary" size="sm" onClick={() => navigate('/store-keeper/inventory')}>
              View inventory
            </Button>
          </div>
          {lowStockProducts.length === 0 ? (
            <EmptyState title="Stock healthy" description="No products are below the low-stock threshold." />
          ) : (
            <div className="divide-y divide-border">
              {lowStockProducts.slice(0, 8).map((product) => (
                <button
                  key={product.id}
                  type="button"
                  className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition-colors hover:bg-surface"
                  onClick={() => navigate(`/store-keeper/products/${product.id}`)}
                >
                  <div className="flex min-w-0 items-center gap-2.5">
                    {product.imageUrl ? (
                      <img src={product.imageUrl} alt={product.name} className="size-9 rounded-lg border border-border bg-surface object-cover" loading="lazy" />
                    ) : (
                      <span className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-border bg-surface text-text-muted">
                        <Package className="size-4" />
                      </span>
                    )}
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-text-primary">{product.name}</p>
                      <p className="text-xs tabular-nums text-text-muted">
                        SKU {product.sku} &middot; {product.availableQuantity}/{product.totalQuantity} available
                      </p>
                    </div>
                  </div>
                  <StockIndicator availableQuantity={product.availableQuantity} totalQuantity={product.totalQuantity} />
                </button>
              ))}
            </div>
          )}
        </section>
      </div>
    </section>
  )
}
