import type { ColumnDef } from '@tanstack/react-table'
import { useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { toast } from 'sonner'

import { PageHeader } from '@/components/layout/PageHeader'
import { DataTable } from '@/components/shared/DataTable'
import { EmptyState } from '@/components/shared/EmptyState'
import { PageSkeleton } from '@/components/shared/PageSkeleton'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useAdjustStock, useProduct, useProductMovements } from '@/hooks/useProducts'
import { getErrorMessage } from '@/lib/errors'
import type { Product, StockMovement } from '@/types/product'

interface ProductDetailPageProps {
  backPath: string
  showStockAdjustment?: boolean
}

function hasAttributeValue(value: string | number | null | undefined) {
  return value !== null && value !== undefined && String(value).trim() !== ''
}

function formatMeasurement(value: number | null | undefined, unit: string) {
  return value === null || value === undefined ? null : `${value} ${unit}`
}

function getProductAttributes(product: Product) {
  return [
    { label: 'Pot Size', value: product.potSize },
    { label: 'Category', value: product.category?.name },
    { label: 'Brand', value: product.brand },
    { label: 'Tags', value: product.tags },
    { label: 'Latin Name', value: product.latinName },
    { label: 'Shape', value: product.shape },
    { label: 'Origin', value: product.origin },
    { label: 'Color Type', value: product.colorType },
    { label: 'Pot Type', value: product.potType },
    { label: 'Display Height', value: product.height },
    { label: 'Unit', value: product.unitOfMeasure },
    { label: 'Weight', value: formatMeasurement(product.weightKg, 'kg') },
    { label: 'Length', value: formatMeasurement(product.lengthCm, 'cm') },
    { label: 'Width', value: formatMeasurement(product.widthCm, 'cm') },
    { label: 'Height', value: formatMeasurement(product.heightCm, 'cm') },
  ].filter((attribute) => hasAttributeValue(attribute.value))
}

export function ProductDetailPage({ backPath, showStockAdjustment = false }: ProductDetailPageProps) {
  const navigate = useNavigate()
  const { id = '' } = useParams()
  const [delta, setDelta] = useState(0)
  const [note, setNote] = useState('')

  const productQuery = useProduct(id)
  const movementsQuery = useProductMovements(id)
  const adjustStockMutation = useAdjustStock()

  const movementColumns = useMemo<Array<ColumnDef<StockMovement>>>(
    () => [
      { accessorKey: 'type', header: 'Type' },
      { accessorKey: 'delta', header: 'Delta' },
      { accessorKey: 'referenceId', header: 'Reference' },
      {
        accessorKey: 'createdAt',
        header: 'Date',
        cell: ({ row }) => <span>{new Date(row.original.createdAt).toLocaleString()}</span>,
      },
    ],
    [],
  )

  if (productQuery.isLoading || movementsQuery.isLoading) {
    return <PageSkeleton />
  }

  if (productQuery.isError) {
    return <EmptyState title="Unable to load product" description={getErrorMessage(productQuery.error, { context: 'load' })} />
  }

  const product = productQuery.data
  if (!product) {
    return <EmptyState title="Product not found" description="The selected product could not be loaded." />
  }

  const description = product.description || product.shortDescription
  const attributes = getProductAttributes(product)

  const handleAdjustStock = async () => {
    try {
      await adjustStockMutation.mutateAsync({
        id: product.id,
        payload: {
          delta,
          note,
        },
      })

      toast.success('Stock adjusted successfully')
      setDelta(0)
      setNote('')
    } catch (error) {
      toast.error(getErrorMessage(error, { context: 'stock' }))
    }
  }

  return (
    <section className="space-y-6">
      <PageHeader
        title="Product Detail"
        subtitle={`${product.name} (${product.sku})`}
        action={
          <Button type="button" variant="secondary" onClick={() => navigate(backPath)}>
            Back
          </Button>
        }
      />

      <section className="grid gap-4 md:grid-cols-3">
        <article className="rounded-xl border border-border bg-surface-raised p-5">
          <p className="text-sm text-text-secondary">Stock quantity</p>
          <p className="mt-2 text-3xl font-bold text-text-primary">{product.stockQuantity}</p>
        </article>
        <article className="rounded-xl border border-border bg-surface-raised p-5">
          <p className="text-sm text-text-secondary">Reserved quantity</p>
          <p className="mt-2 text-3xl font-bold text-text-primary">{product.reservedQuantity}</p>
        </article>
        <article className="rounded-xl border border-border bg-surface-raised p-5">
          <p className="text-sm text-text-secondary">Available quantity</p>
          <p className="mt-2 text-3xl font-bold text-text-primary">{product.availableQuantity}</p>
        </article>
      </section>

      <section className="grid gap-4 lg:grid-cols-[minmax(0,1.4fr)_minmax(280px,0.8fr)]">
        <article className="rounded-xl border border-border bg-surface-raised p-5">
          <h2 className="text-lg font-semibold text-text-primary">Description</h2>
          {description ? (
            <p className="mt-3 whitespace-pre-line text-sm leading-6 text-text-secondary">{description}</p>
          ) : (
            <p className="mt-3 text-sm text-text-muted">No product description available.</p>
          )}
        </article>

        <article className="rounded-xl border border-border bg-surface-raised p-5">
          <h2 className="text-lg font-semibold text-text-primary">Attributes</h2>
          {attributes.length > 0 ? (
            <div className="mt-3 flex flex-wrap gap-2">
              {attributes.map((attribute) => (
                <Badge key={`${attribute.label}-${attribute.value}`} variant="secondary" className="gap-1.5">
                  <span className="text-text-muted">{attribute.label}:</span>
                  <span className="text-text-primary">{attribute.value}</span>
                </Badge>
              ))}
            </div>
          ) : (
            <p className="mt-3 text-sm text-text-muted">No product attributes available.</p>
          )}
        </article>
      </section>

      {showStockAdjustment ? (
        <section className="rounded-xl border border-border bg-surface-raised p-5">
          <h2 className="text-lg font-semibold text-text-primary">Stock adjustment</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-[180px_1fr_auto]">
            <Input type="number" value={delta} onChange={(event) => setDelta(Number(event.target.value))} />
            <Input placeholder="Adjustment note" value={note} onChange={(event) => setNote(event.target.value)} />
            <Button type="button" onClick={handleAdjustStock} disabled={adjustStockMutation.isPending || !note.trim()}>
              {adjustStockMutation.isPending ? 'Saving...' : 'Apply'}
            </Button>
          </div>
        </section>
      ) : null}

      <section>
        <h2 className="mb-3 text-lg font-semibold text-text-primary">Movement history</h2>
        <DataTable
          data={movementsQuery.data ?? []}
          columns={movementColumns}
          isLoading={movementsQuery.isLoading}
          hasError={movementsQuery.isError}
          errorDescription={getErrorMessage(movementsQuery.error, { context: 'load' })}
          emptyTitle="No movements yet"
          emptyDescription="Stock movement entries will appear after product transactions."
        />
      </section>
    </section>
  )
}
