import type { ColumnDef } from '@tanstack/react-table'
import { useMemo } from 'react'
import { toast } from 'sonner'

import { PageHeader } from '@/components/layout/PageHeader'
import { DataTable } from '@/components/shared/DataTable'
import { StockIndicator } from '@/components/shared/StockIndicator'
import { Button } from '@/components/ui/button'
import { useAdjustStock, useProducts } from '@/hooks/useProducts'
import { getErrorMessage } from '@/lib/errors'
import type { Product } from '@/types/product'

export function StoreKeeperInventoryPage() {
  const productsQuery = useProducts()
  const adjustStockMutation = useAdjustStock()

  const columns = useMemo<Array<ColumnDef<Product>>>(
    () => [
      {
        accessorKey: 'name',
        header: 'Name',
        cell: ({ row }) => <span className="font-medium text-text-primary">{row.original.name}</span>,
      },
      { accessorKey: 'sku', header: 'SKU' },
      {
        accessorKey: 'stockQuantity',
        header: 'Stock',
      },
      {
        accessorKey: 'reservedQuantity',
        header: 'Reserved',
      },
      {
        id: 'available',
        header: 'Available',
        cell: ({ row }) => (
          <StockIndicator
            availableQuantity={row.original.availableQuantity}
            totalQuantity={row.original.stockQuantity}
          />
        ),
      },
      {
        id: 'actions',
        header: 'Actions',
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              disabled={adjustStockMutation.isPending}
              onClick={async () => {
                try {
                  await adjustStockMutation.mutateAsync({
                    id: row.original.id,
                    payload: { delta: 1, note: 'Manual increment from inventory screen' },
                  })
                  toast.success('Stock increased')
                } catch (error) {
                  toast.error(getErrorMessage(error, { context: 'stock' }))
                }
              }}
            >
              +1
            </Button>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              disabled={adjustStockMutation.isPending || row.original.availableQuantity < 1}
              onClick={async () => {
                try {
                  await adjustStockMutation.mutateAsync({
                    id: row.original.id,
                    payload: { delta: -1, note: 'Manual decrement from inventory screen' },
                  })
                  toast.success('Stock decreased')
                } catch (error) {
                  toast.error(getErrorMessage(error, { context: 'stock' }))
                }
              }}
            >
              -1
            </Button>
          </div>
        ),
      },
    ],
    [adjustStockMutation],
  )

  return (
    <section className="space-y-6">
      <PageHeader title="Inventory" subtitle="Monitor stock and apply quick adjustments" />

      <DataTable
        data={productsQuery.data ?? []}
        columns={columns}
        isLoading={productsQuery.isLoading}
        hasError={productsQuery.isError}
        errorTitle="Unable to load inventory"
        errorDescription={getErrorMessage(productsQuery.error, { context: 'load' })}
        emptyTitle="No products found"
        emptyDescription="Products will appear here once available in inventory."
      />
    </section>
  )
}
