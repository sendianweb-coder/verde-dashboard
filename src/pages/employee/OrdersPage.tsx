import type { ColumnDef } from '@tanstack/react-table'
import { useMemo, useState } from 'react'

import { PageHeader } from '@/components/layout/PageHeader'
import { DataTable } from '@/components/shared/DataTable'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { Button } from '@/components/ui/button'
import { useOrders } from '@/hooks/useOrders'
import { getErrorMessage } from '@/lib/errors'
import type { Order } from '@/types/order'

type OrderSource = 'WEBSITE' | 'STORE'

const dateFormatter = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
const storeOrderColumns: Array<ColumnDef<Order>> = [{ id: 'storeOrder', header: 'Store Order' }]

function formatAmount(value: string) {
  const amount = Number(value)

  return Number.isNaN(amount) ? 'QAR 0.00' : `QAR ${amount.toFixed(2)}`
}

export function EmployeeOrdersPage() {
  const [source, setSource] = useState<OrderSource>('WEBSITE')
  const ordersQuery = useOrders(undefined, source === 'WEBSITE')
  const columns = useMemo<Array<ColumnDef<Order>>>(
    () => [
      { accessorKey: 'id', header: 'Order' },
      {
        id: 'itemCount',
        header: 'Items',
        cell: ({ row }) => <span>{row.original.items.length} items</span>,
      },
      {
        accessorKey: 'totalAmount',
        header: 'Total',
        cell: ({ row }) => <span className="tabular-nums">{formatAmount(row.original.totalAmount)}</span>,
      },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ row }) => <StatusBadge status={row.original.status} />,
      },
      {
        accessorKey: 'createdAt',
        header: 'Date',
        cell: ({ row }) => <span className="tabular-nums text-text-secondary">{dateFormatter.format(new Date(row.original.createdAt))}</span>,
      },
    ],
    [],
  )

  return (
    <section className="space-y-6">
      <PageHeader title="Orders" subtitle="Review website and store orders" />

      <div className="flex flex-wrap gap-2" role="group" aria-label="Order source">
        <Button type="button" variant={source === 'WEBSITE' ? 'default' : 'secondary'} size="sm" aria-pressed={source === 'WEBSITE'} onClick={() => setSource('WEBSITE')}>
          Website Orders
        </Button>
        <Button type="button" variant={source === 'STORE' ? 'default' : 'secondary'} size="sm" aria-pressed={source === 'STORE'} onClick={() => setSource('STORE')}>
          Store Orders
        </Button>
      </div>

      {source === 'WEBSITE' ? (
        <DataTable
          data={ordersQuery.data ?? []}
          columns={columns}
          title="Website Orders"
          description="Review website orders available to you."
          resultsLabel="orders"
          searchPlaceholder="Search orders..."
          getRowId={(order) => order.id}
          isLoading={ordersQuery.isLoading}
          hasError={ordersQuery.isError}
          errorTitle="Unable to load orders"
          errorDescription={getErrorMessage(ordersQuery.error, { context: 'load' })}
          emptyTitle="No orders found"
          emptyDescription="Website orders will appear here when they are available."
        />
      ) : (
        <DataTable
          data={[]}
          columns={storeOrderColumns}
          title="Store Orders"
          description="Review orders entered for in-store sales."
          resultsLabel="store orders"
          enableSearch={false}
          emptyTitle="Store orders are not available yet"
          emptyDescription="Store orders will appear here once store-order entry is connected."
        />
      )}
    </section>
  )
}
