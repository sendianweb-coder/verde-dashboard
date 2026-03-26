import type { ColumnDef } from '@tanstack/react-table'
import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'

import { PageHeader } from '@/components/layout/PageHeader'
import { CreateProductDialog } from '@/components/admin/products/CreateProductDialog'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { DataTable } from '@/components/shared/DataTable'
import { StockIndicator } from '@/components/shared/StockIndicator'
import { Button } from '@/components/ui/button'
import { useDeactivateProduct, useProducts } from '@/hooks/useProducts'
import { getErrorMessage } from '@/lib/errors'
import type { Product } from '@/types/product'

export function AdminProductsPage() {
  const navigate = useNavigate()
  const productsQuery = useProducts()
  const deactivateProductMutation = useDeactivateProduct()

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
          <StockIndicator availableQuantity={row.original.availableQuantity} totalQuantity={row.original.stockQuantity} />
        ),
      },
      {
        accessorKey: 'price',
        header: 'Price',
        cell: ({ row }) => <span>${Number(row.original.price).toFixed(2)}</span>,
      },
      {
        id: 'actions',
        header: 'Actions',
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <Button type="button" variant="secondary" size="sm" onClick={() => navigate(`/admin/products/${row.original.id}`)}>
              View
            </Button>
            <ConfirmDialog
              title="Deactivate product"
              description="Are you sure you want to deactivate this product?"
              confirmLabel="Deactivate"
              variant="destructive"
              isLoading={deactivateProductMutation.isPending}
              onConfirm={async () => {
                try {
                  await deactivateProductMutation.mutateAsync(row.original.id)
                  toast.success('Product deactivated')
                } catch (error) {
                  toast.error(getErrorMessage(error, { context: 'update' }))
                }
              }}
              trigger={
                <Button type="button" variant="destructive" size="sm" disabled={!row.original.isActive}>
                  Deactivate
                </Button>
              }
            />
          </div>
        ),
      },
    ],
    [deactivateProductMutation, navigate],
  )

  return (
    <section className="space-y-6">
      <PageHeader 
        title="Product Management" 
        subtitle="Monitor and maintain product inventory" 
        action={
          <CreateProductDialog onCreate={() => productsQuery.refetch()}>
            <Button type="button">Create Product</Button>
          </CreateProductDialog>
        } 
      />

      <DataTable
        data={productsQuery.data ?? []}
        columns={columns}
        isLoading={productsQuery.isLoading}
        hasError={productsQuery.isError}
        errorTitle="Unable to load products"
        errorDescription={getErrorMessage(productsQuery.error, { context: 'load' })}
        emptyTitle="No products found"
        emptyDescription="Create products to manage them from this page."
      />
    </section>
  )
}
