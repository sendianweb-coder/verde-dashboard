import type { ColumnDef } from '@tanstack/react-table'
import { Filter } from 'lucide-react'
import { useMemo, useState } from 'react'
import { toast } from 'sonner'

import { PageHeader } from '@/components/layout/PageHeader'
import { DataTable } from '@/components/shared/DataTable'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
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

const statusFilterOptions: Array<{ label: string; value: 'ALL' | OrderStatus }> = [
  { label: 'All statuses', value: 'ALL' },
  { label: 'Pending', value: 'PENDING' },
  { label: 'Processing', value: 'PROCESSING' },
  { label: 'Shipped', value: 'SHIPPED' },
  { label: 'Delivered', value: 'DELIVERED' },
  { label: 'Cancelled', value: 'CANCELLED' },
]

export function AdminOrdersPage() {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'ALL' | OrderStatus>('ALL')
  const [pageIndex, setPageIndex] = useState(0)
  const [pageSize, setPageSize] = useState(10)
  const orderParams = useMemo(
    () => ({
      status: statusFilter === 'ALL' ? undefined : statusFilter,
      search: search.trim() || undefined,
    }),
    [search, statusFilter],
  )
  const ordersQuery = useOrders(orderParams)
  const updateOrderStatusMutation = useUpdateOrderStatus()
  const hasActiveFilters = statusFilter !== 'ALL'

  const columns = useMemo<Array<ColumnDef<Order>>>(
    () => [
      { accessorKey: 'id', header: 'Order ID' },
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
      <PageHeader title="Order Overview" subtitle="Track and update all customer orders" />
      <DataTable
        data={ordersQuery.data ?? []}
        columns={columns}
        title="Orders"
        description="Track customer orders, fulfillment status, and totals."
        resultsLabel="orders"
        searchPlaceholder="Search orders..."
        searchValue={search}
        onSearchChange={(value) => {
          setSearch(value)
          setPageIndex(0)
        }}
        pageIndex={pageIndex}
        pageSize={pageSize}
        onPageChange={setPageIndex}
        onPageSizeChange={(nextPageSize) => {
          setPageSize(nextPageSize)
          setPageIndex(0)
        }}
        filters={
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button type="button" variant="secondary" size="sm" className="relative h-9">
                <Filter className="size-4" />
                Filter
                {hasActiveFilters ? <span className="absolute -right-1 -top-1 size-2 rounded-full bg-brand-600" /> : null}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>Status</DropdownMenuLabel>
              {statusFilterOptions.map((option) => (
                <DropdownMenuCheckboxItem
                  key={option.value}
                  checked={statusFilter === option.value}
                  onCheckedChange={() => {
                    setStatusFilter(option.value)
                    setPageIndex(0)
                  }}
                >
                  {option.label}
                </DropdownMenuCheckboxItem>
              ))}
              {hasActiveFilters ? (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onSelect={() => {
                      setStatusFilter('ALL')
                      setPageIndex(0)
                    }}
                  >
                    Clear filters
                  </DropdownMenuItem>
                </>
              ) : null}
            </DropdownMenuContent>
          </DropdownMenu>
        }
        isLoading={ordersQuery.isLoading}
        hasError={ordersQuery.isError}
        errorTitle="Unable to load orders"
        errorDescription={getErrorMessage(ordersQuery.error, { context: 'load' })}
        emptyTitle="No orders found"
        emptyDescription="Orders will appear here once synced from commerce system."
      />
    </section>
  )
}
