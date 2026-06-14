import type { ColumnDef } from '@tanstack/react-table'
import { MoreHorizontal, Package } from 'lucide-react'
import { useMemo } from 'react'
import { toast } from 'sonner'

import { PageHeader } from '@/components/layout/PageHeader'
import { DataTable } from '@/components/shared/DataTable'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useOrders, useUpdateOrderStatus } from '@/hooks/useOrders'
import { getErrorMessage } from '@/lib/errors'
import type { Order, OrderStatus } from '@/types/order'

const statusTransitions: Array<{ label: string; value: OrderStatus }> = [
  { label: 'Pending', value: 'PENDING' },
  { label: 'Processing', value: 'PROCESSING' },
  { label: 'Shipped', value: 'SHIPPED' },
  { label: 'Delivered', value: 'DELIVERED' },
]

const dateFormatter = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' })

function formatDate(value: string) {
  return dateFormatter.format(new Date(value))
}

function formatAmount(value: string | number) {
  const amount = Number(value)

  if (Number.isNaN(amount)) {
    return 'QAR 0.00'
  }

  return `QAR ${amount.toFixed(2)}`
}

export function StoreKeeperOrdersPage() {
  const ordersQuery = useOrders()
  const updateOrderStatusMutation = useUpdateOrderStatus()

  const columns = useMemo<Array<ColumnDef<Order>>>(
    () => [
      {
        accessorKey: 'id',
        header: 'Order',
        cell: ({ row }) => {
          const order = row.original

          return (
            <div className="flex items-center gap-2.5">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-border bg-surface text-text-muted">
                <Package className="size-4" />
              </span>
              <div className="min-w-0">
                <p className="truncate font-medium text-text-primary">Order {order.id.slice(0, 8)}</p>
                <p className="text-xs tabular-nums text-text-muted">Customer {order.customerId.slice(0, 8)}</p>
              </div>
            </div>
          )
        },
      },
      {
        id: 'itemCount',
        header: 'Items',
        cell: ({ row }) => (
          <span className="inline-flex rounded-md border border-border bg-background px-2 py-0.5 text-xs font-medium tabular-nums text-text-secondary">
            {row.original.items.length} items
          </span>
        ),
      },
      {
        accessorKey: 'totalAmount',
        header: 'Total',
        cell: ({ row }) => <span className="text-sm tabular-nums text-text-secondary">{formatAmount(row.original.totalAmount)}</span>,
      },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ row }) => <StatusBadge status={row.original.status} />,
      },
      {
        accessorKey: 'createdAt',
        header: 'Date',
        cell: ({ row }) => <span className="text-sm tabular-nums text-text-secondary">{formatDate(row.original.createdAt)}</span>,
      },
      {
        id: 'actions',
        cell: ({ row }) => (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button type="button" variant="ghost" size="icon" className="size-8" aria-label="Open order actions">
                <MoreHorizontal className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuLabel>Update status</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {statusTransitions.map((statusOption) => (
                <DropdownMenuItem
                  key={statusOption.value}
                  disabled={updateOrderStatusMutation.isPending || row.original.status === statusOption.value}
                  onSelect={async () => {
                    try {
                      await updateOrderStatusMutation.mutateAsync({
                        id: row.original.id,
                        payload: { status: statusOption.value },
                      })
                      toast.success(`Order updated to ${statusOption.label}`)
                    } catch (error) {
                      toast.error(getErrorMessage(error, { context: 'update' }))
                    }
                  }}
                >
                  {statusOption.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        ),
      },
    ],
    [updateOrderStatusMutation],
  )

  return (
    <section className="space-y-6">
      <PageHeader title="Orders" subtitle="Manage customer order statuses" />

      <DataTable
        data={ordersQuery.data ?? []}
        columns={columns}
        title="Orders"
        description="Scan customer orders, item counts, totals, and fulfillment status."
        resultsLabel="orders"
        searchPlaceholder="Search orders..."
        getRowId={(order) => order.id}
        isLoading={ordersQuery.isLoading}
        hasError={ordersQuery.isError}
        errorTitle="Unable to load orders"
        errorDescription={getErrorMessage(ordersQuery.error, { context: 'load' })}
        emptyTitle="No orders found"
        emptyDescription="Incoming customer orders will appear here."
      />
    </section>
  )
}
