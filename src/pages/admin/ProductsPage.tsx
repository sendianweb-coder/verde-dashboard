import type { ColumnDef } from '@tanstack/react-table'
import { Eye, Filter, MoreHorizontal, Package, Power } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'

import { PageHeader } from '@/components/layout/PageHeader'
import { CreateProductDialog } from '@/components/admin/products/CreateProductDialog'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { DataTable } from '@/components/shared/DataTable'
import { StockIndicator } from '@/components/shared/StockIndicator'
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
import { useCategories } from '@/hooks/useCategories'
import { useDeactivateProduct, usePaginatedProducts } from '@/hooks/useProducts'
import { getErrorMessage } from '@/lib/errors'
import { cn } from '@/lib/utils'
import type { Product, ProductStockStatus } from '@/types/product'

type ProductStockFilter = 'all' | ProductStockStatus
type BooleanFilter = 'all' | 'true' | 'false'

const stockFilterLabels: Record<ProductStockFilter, string> = {
  all: 'Stock Status',
  instock: 'In stock',
  outofstock: 'Out of stock',
}

const booleanFilterLabels: Record<BooleanFilter, string> = {
  all: 'All',
  true: 'Yes',
  false: 'No',
}

function ProductImage({ product }: { product: Product }) {
  return product.imageUrl ? (
    <img
      src={product.imageUrl}
      alt={product.name}
      className="size-9 rounded-lg border border-border bg-surface object-cover"
      loading="lazy"
    />
  ) : (
    <div className="flex size-9 items-center justify-center rounded-lg border border-border bg-surface text-text-muted">
      <Package className="size-4" />
    </div>
  )
}

function ProductCategoryBadge({ categoryName }: { categoryName: string | null }) {
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

function formatPrice(value: string | number | null | undefined) {
  if (value === null || value === undefined) {
    return 'QAR 0.00'
  }
  const price = Number(value)

  if (Number.isNaN(price)) {
    return 'QAR 0.00'
  }

  return `QAR ${price.toFixed(2)}`
}

export function AdminProductsPage() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [stockFilter, setStockFilter] = useState<ProductStockFilter>('all')
  const [featuredFilter, setFeaturedFilter] = useState<BooleanFilter>('all')
  const [publishedFilter, setPublishedFilter] = useState<BooleanFilter>('all')
  const [pageIndex, setPageIndex] = useState(0)
  const [pageSize, setPageSize] = useState(20)
  const [productPendingDeactivation, setProductPendingDeactivation] = useState<Product | null>(null)
  const productParams = useMemo(
    () => ({
      categoryId: categoryFilter === 'all' ? undefined : categoryFilter,
      featured: featuredFilter === 'all' ? undefined : featuredFilter,
      published: publishedFilter === 'all' ? undefined : publishedFilter,
      stockStatus: stockFilter === 'all' ? undefined : stockFilter,
      search: search.trim() || undefined,
      limit: pageSize,
      offset: pageIndex * pageSize,
    }),
    [categoryFilter, featuredFilter, pageIndex, pageSize, publishedFilter, search, stockFilter],
  )
  const productsQuery = usePaginatedProducts(productParams)
  const categoriesQuery = useCategories()
  const deactivateProductMutation = useDeactivateProduct()

  const categories = useMemo(() => {
    return (categoriesQuery.data ?? [])
      .map((category) => ({ id: category.id, name: category.name }))
      .sort((firstCategory, secondCategory) => firstCategory.name.localeCompare(secondCategory.name))
  }, [categoriesQuery.data])

  const products = productsQuery.data?.data ?? []
  const totalProducts = productsQuery.data?.pagination.total ?? 0
  const pageCount = Math.max(1, Math.ceil(totalProducts / pageSize))
  const hasActiveFilters = categoryFilter !== 'all' || stockFilter !== 'all' || featuredFilter !== 'all' || publishedFilter !== 'all'

  const clearFilters = () => {
    setCategoryFilter('all')
    setStockFilter('all')
    setFeaturedFilter('all')
    setPublishedFilter('all')
    setPageIndex(0)
  }

  const columns = useMemo<Array<ColumnDef<Product>>>(
    () => [
      {
        accessorKey: 'name',
        header: 'Product',
        cell: ({ row }) => {
          const product = row.original

          return (
            <div className="flex items-center gap-2.5">
              <ProductImage product={product} />
              <div className="min-w-0">
                <p className="truncate font-medium text-text-primary">{product.name}</p>
                <p className="text-xs tabular-nums text-text-muted">SKU {product.sku}</p>
              </div>
            </div>
          )
        },
      },
      {
        accessorKey: 'category.name',
        header: 'Category',
        cell: ({ row }) => <ProductCategoryBadge categoryName={row.original.category?.name ?? null} />,
      },
      {
        accessorKey: 'stockQuantity',
        header: 'Stock',
        cell: ({ row }) => {
          const product = row.original

          return (
            <div className="space-y-0.5 text-sm tabular-nums">
              <p className="font-medium text-text-primary">{product.availableQuantity} available</p>
              <p className="text-xs text-text-secondary">
                {product.stockQuantity} total &middot; {product.reservedQuantity} reserved
              </p>
            </div>
          )
        },
      },
      {
        id: 'available',
        header: 'Status',
        cell: ({ row }) => (
          <StockIndicator availableQuantity={row.original.availableQuantity} totalQuantity={row.original.stockQuantity} />
        ),
      },
      {
        accessorKey: 'price',
        header: 'Price',
        cell: ({ row }) => <span className="text-sm tabular-nums text-text-secondary">{formatPrice(row.original.regularPrice)}</span>,
      },
      {
        id: 'actions',
        cell: ({ row }) => (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button type="button" variant="ghost" size="icon" className="size-8" aria-label="Open product actions">
                <MoreHorizontal className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuItem onSelect={() => navigate(`/admin/products/${row.original.id}`)}>
                <Eye className="size-4" />
                View product
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                disabled={!row.original.isActive}
                className="text-error focus:text-error"
                onSelect={() => setProductPendingDeactivation(row.original)}
              >
                <Power className="size-4" />
                Deactivate
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ),
      },
    ],
    [navigate],
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
        data={products}
        columns={columns}
        title="Products"
        description="Browse inventory, stock health, categories, and pricing."
        resultsLabel="products"
        searchPlaceholder="Search products..."
        searchValue={search}
        onSearchChange={(value) => {
          setSearch(value)
          setPageIndex(0)
        }}
        manualPagination
        pageIndex={pageIndex}
        pageSize={pageSize}
        pageCount={pageCount}
        totalResults={totalProducts}
        onPageChange={setPageIndex}
        onPageSizeChange={(nextPageSize) => {
          setPageSize(nextPageSize)
          setPageIndex(0)
        }}
        getRowId={(product) => product.id}
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
              <DropdownMenuLabel>Category</DropdownMenuLabel>
              <DropdownMenuCheckboxItem
                checked={categoryFilter === 'all'}
                onCheckedChange={() => {
                  setCategoryFilter('all')
                  setPageIndex(0)
                }}
              >
                All categories
              </DropdownMenuCheckboxItem>
              {categories.map((category) => (
                <DropdownMenuCheckboxItem
                  key={category.id}
                  checked={categoryFilter === category.id}
                  onCheckedChange={() => {
                    setCategoryFilter(category.id)
                    setPageIndex(0)
                  }}
                >
                  {category.name}
                </DropdownMenuCheckboxItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuLabel>Stock</DropdownMenuLabel>
              {(Object.keys(stockFilterLabels) as ProductStockFilter[]).map((filter) => (
                <DropdownMenuCheckboxItem
                  key={filter}
                  checked={stockFilter === filter}
                  onCheckedChange={() => {
                    setStockFilter(filter)
                    setPageIndex(0)
                  }}
                >
                  {stockFilterLabels[filter]}
                </DropdownMenuCheckboxItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuLabel>Featured</DropdownMenuLabel>
              {(Object.keys(booleanFilterLabels) as BooleanFilter[]).map((filter) => (
                <DropdownMenuCheckboxItem
                  key={filter}
                  checked={featuredFilter === filter}
                  onCheckedChange={() => {
                    setFeaturedFilter(filter)
                    setPageIndex(0)
                  }}
                >
                  {booleanFilterLabels[filter]}
                </DropdownMenuCheckboxItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuLabel>Published</DropdownMenuLabel>
              {(Object.keys(booleanFilterLabels) as BooleanFilter[]).map((filter) => (
                <DropdownMenuCheckboxItem
                  key={filter}
                  checked={publishedFilter === filter}
                  onCheckedChange={() => {
                    setPublishedFilter(filter)
                    setPageIndex(0)
                  }}
                >
                  {booleanFilterLabels[filter]}
                </DropdownMenuCheckboxItem>
              ))}
              {hasActiveFilters ? (
                <>
                  <DropdownMenuSeparator />
                  <Button type="button" variant="ghost" size="sm" className="w-full justify-start" onClick={clearFilters}>
                    Clear filters
                  </Button>
                </>
              ) : null}
            </DropdownMenuContent>
          </DropdownMenu>
        }
        isLoading={productsQuery.isLoading}
        hasError={productsQuery.isError}
        errorTitle="Unable to load products"
        errorDescription={getErrorMessage(productsQuery.error, { context: 'load' })}
        emptyTitle="No products found"
        emptyDescription="Create products to manage them from this page."
      />

      <ConfirmDialog
        open={Boolean(productPendingDeactivation)}
        onOpenChange={(open) => {
          if (!open) {
            setProductPendingDeactivation(null)
          }
        }}
        title="Deactivate product"
        description={`Are you sure you want to deactivate ${productPendingDeactivation?.name ?? 'this product'}?`}
        confirmLabel="Deactivate"
        variant="destructive"
        isLoading={deactivateProductMutation.isPending}
        onConfirm={async () => {
          if (!productPendingDeactivation) {
            return
          }

          try {
            await deactivateProductMutation.mutateAsync(productPendingDeactivation.id)
            toast.success('Product deactivated')
          } catch (error) {
            toast.error(getErrorMessage(error, { context: 'update' }))
            throw error
          }
        }}
      />
    </section>
  )
}
