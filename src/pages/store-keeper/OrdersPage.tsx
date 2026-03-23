import type { ColumnDef } from '@tanstack/react-table'
import { useMemo } from 'react'
import { toast } from 'sonner'

import { PageHeader } from '@/components/layout/PageHeader'
import { DataTable } from '@/components/shared/DataTable'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { Button } from '@/components/ui/button'
import { useOrders, useUpdateOrderStatus } from '@/hooks/useOrders'
import type { Order, OrderStatus } from '@/types/order'

const statusTransitions: Array<{ label: string; value: OrderStatus }> = [
  { label: 'Pending', value: 'PENDING' },
  { label: 'Processing', value: 'PROCESSING' },
  { label: 'Shipped', value: 'SHIPPED' },
  { label: 'Delivered', value: 'DELIVERED' },
]

export function StoreKeeperOrdersPage() {
  const ordersQuery = useOrders()
  const updateOrderStatusMutation = useUpdateOrderStatus()

  const columns = useMemo<Array<ColumnDef<Order>>>(
    () => [
      {
        accessorKey: 'id',
        header: 'Order ID',
      },
      {
        id: 'itemCount',
        header: 'Items',
        cell: ({ row }) => <span>{row.original.items.length}</span>,
      },
      {
        accessorKey: 'totalAmount',
        header: 'Total',
        cell: ({ row }) => <span>${Number(row.original.totalAmount).toFixed(2)}</span>,
      },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ row }) => <StatusBadge status={row.original.status} />,
      },
      {
        accessorKey: 'createdAt',
        header: 'Date',
        cell: ({ row }) => <span>{new Date(row.original.createdAt).toLocaleDateString()}</span>,
      },
      {
        id: 'actions',
        header: 'Update',
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            {statusTransitions.map((statusOption) => (
              <Button
                key={statusOption.value}
                type="button"
                size="sm"
                variant={row.original.status === statusOption.value ? 'default' : 'secondary'}
                disabled={updateOrderStatusMutation.isPending}
                onClick={async () => {
                  await updateOrderStatusMutation.mutateAsync({
                    id: row.original.id,
                    payload: { status: statusOption.value },
                  })
                  toast.success(`Order updated to ${statusOption.label}`)
                }}
              >
                {statusOption.label}
              </Button>
            ))}
          </div>
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
        isLoading={ordersQuery.isLoading}
        emptyTitle="No orders found"
        emptyDescription="Incoming customer orders will appear here."
      />
    </section>
  )
}
