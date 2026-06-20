import { AlertTriangle, Minus, Package, Plus, ShoppingCart, Trash2 } from 'lucide-react'
import { useEffect, useState } from 'react'

import { StockIndicator } from '@/components/shared/StockIndicator'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import type { CreateRequestFormValues } from '@/lib/validators'
import type { Product } from '@/types/product'

function clampQuantity(quantity: number, maxQuantity?: number) {
  const safeQuantity = Number.isFinite(quantity) ? Math.floor(quantity) : 1
  const minimumQuantity = Math.max(1, safeQuantity)

  if (typeof maxQuantity !== 'number' || maxQuantity < 1) {
    return minimumQuantity
  }

  return Math.min(minimumQuantity, maxQuantity)
}

export function ProductImage({ product }: { product: Product }) {
  return product.imageUrl ? (
    <img
      src={product.imageUrl}
      alt={product.name}
      className="size-12 rounded-lg border border-border bg-surface object-cover"
      loading="lazy"
    />
  ) : (
    <div className="flex size-12 items-center justify-center rounded-lg border border-border bg-surface text-text-muted">
      <Package className="size-5" />
    </div>
  )
}

export function ProductCategoryBadge({ categoryName }: { categoryName: string | null }) {
  return (
    <span
      className={cn(
        'inline-flex rounded-md px-2 py-0.5 text-xs font-medium',
        categoryName ? 'bg-surface text-text-secondary' : 'border border-border bg-background text-text-muted',
      )}
    >
      {categoryName ?? 'Uncategorized'}
    </span>
  )
}

export function ProductMeta({ product }: { product: Product }) {
  const metadata = [product.sku ? `SKU ${product.sku}` : null, product.brand, product.potSize, product.height, product.unitOfMeasure]
    .filter(Boolean)
    .slice(0, 4)

  return <p className="text-xs text-text-muted">{metadata.join(' / ') || 'No product metadata'}</p>
}

interface ProductQuantityControlsProps {
  quantity: number
  maxQuantity?: number
  onQuantityChange: (quantity: number) => void
}

export function ProductQuantityControls({ quantity, maxQuantity, onQuantityChange }: ProductQuantityControlsProps) {
  const [inputValue, setInputValue] = useState(String(quantity))

  useEffect(() => {
    setInputValue(String(quantity))
  }, [quantity])

  const updateQuantity = (nextQuantity: number) => {
    const clampedQuantity = clampQuantity(nextQuantity, maxQuantity)

    setInputValue(String(clampedQuantity))
    onQuantityChange(clampedQuantity)
  }

  return (
    <div className="flex items-center rounded-lg border border-border bg-background">
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="size-8 rounded-r-none shadow-none"
        onClick={() => onQuantityChange(quantity - 1)}
        aria-label="Decrease quantity"
      >
        <Minus className="size-4" />
      </Button>
      <Input
        type="text"
        inputMode="numeric"
        pattern="[0-9]*"
        value={inputValue}
        onChange={(event) => {
          const nextValue = event.target.value

          if (!/^\d*$/.test(nextValue)) {
            return
          }

          if (!nextValue) {
            setInputValue('')
            return
          }

          updateQuantity(Number(nextValue))
        }}
        onBlur={() => {
          if (!inputValue) {
            setInputValue(String(quantity))
            return
          }

          updateQuantity(Number(inputValue))
        }}
        className="h-8 w-14 rounded-none border-x border-y-0 border-border bg-background px-1 text-center text-sm font-medium tabular-nums shadow-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
        aria-label="Quantity"
      />
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="size-8 rounded-l-none shadow-none"
        onClick={() => updateQuantity(quantity + 1)}
        aria-label="Increase quantity"
      >
        <Plus className="size-4" />
      </Button>
    </div>
  )
}

interface ProductCatalogRowProps {
  product: Product
  selectedQuantity: number
  onAdd: (product: Product) => void
  onQuantityChange: (product: Product, quantity: number) => void
}

export function ProductCatalogRow({ product, selectedQuantity, onAdd, onQuantityChange }: ProductCatalogRowProps) {
  const isSelected = selectedQuantity > 0
  const isUnavailable = !product.isActive || product.availableQuantity <= 0

  return (
    <article
      className={cn(
        'grid gap-3 rounded-xl border border-border bg-surface-raised p-3 transition-colors hover:bg-surface md:grid-cols-[1fr_auto]',
        isSelected && 'border-brand-600/30 bg-brand-50/60',
      )}
    >
      <div className="flex min-w-0 gap-3">
        <ProductImage product={product} />
        <div className="min-w-0 space-y-2">
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-text-primary">{product.name}</p>
            <ProductMeta product={product} />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <ProductCategoryBadge categoryName={product.category?.name ?? null} />
            <StockIndicator availableQuantity={product.availableQuantity} totalQuantity={product.totalQuantity} />
            <span className="text-xs tabular-nums text-text-secondary">
              {product.totalQuantity} total / {product.reservedQuantity} reserved / {product.availableQuantity} available
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between gap-3 md:justify-end">
        {isSelected ? (
          <ProductQuantityControls
            quantity={selectedQuantity}
            maxQuantity={product.availableQuantity}
            onQuantityChange={(quantity) => onQuantityChange(product, quantity)}
          />
        ) : (
          <Button type="button" size="sm" disabled={isUnavailable} onClick={() => onAdd(product)}>
            <Plus className="size-4" />
            {isUnavailable ? 'Unavailable' : 'Add'}
          </Button>
        )}
      </div>
    </article>
  )
}

interface RequestTrayProps {
  productsById: Map<string, Product>
  items: CreateRequestFormValues['items']
  hasStockConflict: boolean
  isSubmitting: boolean
  canSubmit: boolean
  onQuantityChange: (productId: string, quantity: number) => void
  onRemove: (productId: string) => void
}

export function RequestTray({
  productsById,
  items,
  hasStockConflict,
  isSubmitting,
  canSubmit,
  onQuantityChange,
  onRemove,
}: RequestTrayProps) {
  const totalQuantity = items.reduce((total, item) => total + item.quantity, 0)

  return (
    <aside className="sticky top-6 rounded-xl border border-border bg-surface-raised">
      <div className="flex items-start justify-between gap-3 border-b border-border p-5">
        <div>
          <div className="flex items-center gap-2">
            <ShoppingCart className="size-4 text-brand-600" />
            <h2 className="text-lg font-semibold text-text-primary">Request tray</h2>
          </div>
          <p className="mt-1 text-sm text-text-secondary">
            {items.length} products / {totalQuantity} total units
          </p>
        </div>
      </div>

      <div className="max-h-[52vh] space-y-3 overflow-y-auto p-5">
        {items.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border bg-background p-4 text-sm text-text-secondary">
            Add products from the catalog. Selected products will stay here while you continue browsing.
          </div>
        ) : (
          items.map((item) => {
            const product = productsById.get(item.productId)
            const availableQuantity = product?.availableQuantity ?? item.availableQuantity ?? 0
            const exceedsStock = item.quantity > availableQuantity

            return (
              <article key={item.productId} className="rounded-lg border border-border bg-background p-3">
                <div className="flex gap-3">
                  {product ? <ProductImage product={product} /> : null}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-text-primary">{product?.name ?? item.productId}</p>
                    {product ? <ProductMeta product={product} /> : null}
                    <p className={cn('mt-1 text-xs tabular-nums', exceedsStock ? 'text-error' : 'text-text-secondary')}>
                      Available: {availableQuantity}
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="size-8 shrink-0 text-text-muted hover:text-error"
                    onClick={() => onRemove(item.productId)}
                    aria-label={`Remove ${product?.name ?? 'product'} from request`}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>

                <div className="mt-3 flex items-center justify-between gap-3">
                  <ProductQuantityControls
                    quantity={item.quantity}
                    maxQuantity={availableQuantity}
                    onQuantityChange={(quantity) => onQuantityChange(item.productId, quantity)}
                  />
                  {exceedsStock ? (
                    <span className="inline-flex items-center gap-1 rounded-md border border-error/30 bg-error/5 px-2 py-1 text-xs font-medium text-error">
                      <AlertTriangle className="size-3.5" />
                      Over stock
                    </span>
                  ) : null}
                </div>
              </article>
            )
          })
        )}
      </div>

      <div className="space-y-3 border-t border-border p-5">
        {hasStockConflict ? (
          <p className="rounded-lg border border-warning bg-pending-bg px-3 py-2 text-sm text-pending-text">
            One or more item quantities exceed available stock.
          </p>
        ) : null}
        <Button type="submit" className="w-full" disabled={!canSubmit || isSubmitting}>
          {isSubmitting ? 'Submitting...' : 'Submit Request'}
        </Button>
      </div>
    </aside>
  )
}
