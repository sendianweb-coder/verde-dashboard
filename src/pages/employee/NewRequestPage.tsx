import { zodResolver } from '@hookform/resolvers/zod'
import {
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Filter,
  Minus,
  Package,
  Plus,
  Search,
  ShoppingCart,
  Trash2,
  X,
} from 'lucide-react'
import { useDeferredValue, useMemo, useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'

import { PageHeader } from '@/components/layout/PageHeader'
import { PageSkeleton } from '@/components/shared/PageSkeleton'
import { StockIndicator } from '@/components/shared/StockIndicator'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useCategories } from '@/hooks/useCategories'
import { usePaginatedProducts } from '@/hooks/useProducts'
import { useCreateProject, useProjects } from '@/hooks/useProjects'
import { useCreateRequest } from '@/hooks/useRequests'
import { getErrorMessage } from '@/lib/errors'
import { cn } from '@/lib/utils'
import { createRequestSchema, type CreateRequestFormValues } from '@/lib/validators'
import type { Product, ProductStockStatus } from '@/types/product'

const PRODUCT_PAGE_SIZE = 12
const EMPTY_PRODUCTS: Product[] = []
const EMPTY_REQUEST_ITEMS: CreateRequestFormValues['items'] = []

type ProductStockFilter = 'all' | ProductStockStatus

const stockFilterLabels: Record<ProductStockFilter, string> = {
  all: 'All stock',
  instock: 'In stock',
  outofstock: 'Out of stock',
}

function ProductImage({ product }: { product: Product }) {
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

function ProductMeta({ product }: { product: Product }) {
  const metadata = [product.sku ? `SKU ${product.sku}` : null, product.brand, product.potSize, product.height, product.unitOfMeasure]
    .filter(Boolean)
    .slice(0, 4)

  return <p className="text-xs text-text-muted">{metadata.join(' / ') || 'No product metadata'}</p>
}

function ProductQuantityControls({ quantity, onDecrease, onIncrease }: { quantity: number; onDecrease: () => void; onIncrease: () => void }) {
  return (
    <div className="flex items-center rounded-lg border border-border bg-background">
      <Button type="button" variant="ghost" size="icon" className="size-8 rounded-r-none shadow-none" onClick={onDecrease} aria-label="Decrease quantity">
        <Minus className="size-4" />
      </Button>
      <span className="min-w-9 text-center text-sm font-medium tabular-nums text-text-primary">{quantity}</span>
      <Button type="button" variant="ghost" size="icon" className="size-8 rounded-l-none shadow-none" onClick={onIncrease} aria-label="Increase quantity">
        <Plus className="size-4" />
      </Button>
    </div>
  )
}

interface ProductCatalogRowProps {
  product: Product
  selectedQuantity: number
  onAdd: (product: Product) => void
  onDecrease: (product: Product) => void
  onIncrease: (product: Product) => void
}

function ProductCatalogRow({ product, selectedQuantity, onAdd, onDecrease, onIncrease }: ProductCatalogRowProps) {
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
            <StockIndicator availableQuantity={product.availableQuantity} totalQuantity={product.stockQuantity} />
            <span className="text-xs tabular-nums text-text-secondary">
              {product.stockQuantity} total / {product.reservedQuantity} reserved
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between gap-3 md:justify-end">
        {isSelected ? (
          <ProductQuantityControls
            quantity={selectedQuantity}
            onDecrease={() => onDecrease(product)}
            onIncrease={() => onIncrease(product)}
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

function RequestTray({
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
                    onDecrease={() => onQuantityChange(item.productId, item.quantity - 1)}
                    onIncrease={() => onQuantityChange(item.productId, item.quantity + 1)}
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

export function EmployeeNewRequestPage() {
  const navigate = useNavigate()
  const [isCreateProjectOpen, setIsCreateProjectOpen] = useState(false)
  const [newProjectName, setNewProjectName] = useState('')
  const [newProjectDescription, setNewProjectDescription] = useState('')
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [stockFilter, setStockFilter] = useState<ProductStockFilter>('all')
  const [pageIndex, setPageIndex] = useState(0)
  const [selectedProductsById, setSelectedProductsById] = useState<Map<string, Product>>(() => new Map())
  const deferredSearch = useDeferredValue(search)

  const projectsQuery = useProjects()
  const categoriesQuery = useCategories()
  const createRequestMutation = useCreateRequest()
  const createProjectMutation = useCreateProject()

  const productParams = useMemo(
    () => ({
      categoryId: categoryFilter === 'all' ? undefined : categoryFilter,
      stockStatus: stockFilter === 'all' ? undefined : stockFilter,
      search: deferredSearch.trim() || undefined,
      limit: PRODUCT_PAGE_SIZE,
      offset: pageIndex * PRODUCT_PAGE_SIZE,
    }),
    [categoryFilter, deferredSearch, pageIndex, stockFilter],
  )
  const productsQuery = usePaginatedProducts(productParams)

  const {
    control,
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<CreateRequestFormValues>({
    resolver: zodResolver(createRequestSchema),
    defaultValues: {
      projectId: '',
      notes: '',
      items: [],
    },
  })

  const watchedProjectId = useWatch({ control, name: 'projectId' })
  const watchedItemsValue = useWatch({ control, name: 'items' })

  const projects = projectsQuery.data ?? []
  const categories = categoriesQuery.data ?? []
  const products = productsQuery.data?.data ?? EMPTY_PRODUCTS
  const totalProducts = productsQuery.data?.pagination.total ?? 0
  const pageCount = Math.max(1, Math.ceil(totalProducts / PRODUCT_PAGE_SIZE))
  const watchedItems = watchedItemsValue ?? EMPTY_REQUEST_ITEMS
  const hasActiveFilters = categoryFilter !== 'all' || stockFilter !== 'all'

  const allKnownProducts = useMemo(() => {
    const productMap = new Map(products.map((product) => [product.id, product]))

    selectedProductsById.forEach((product, productId) => {
      productMap.set(productId, product)
    })

    return productMap
  }, [products, selectedProductsById])

  const hasStockConflict = watchedItems.some((item) => {
    const availableQuantity = allKnownProducts.get(item.productId)?.availableQuantity ?? item.availableQuantity ?? 0
    return item.quantity > availableQuantity
  })
  const canSubmit = Boolean(watchedProjectId) && watchedItems.length > 0 && !hasStockConflict

  if (projectsQuery.isLoading || categoriesQuery.isLoading) {
    return <PageSkeleton />
  }

  if (projectsQuery.isError || categoriesQuery.isError) {
    return (
      <section className="space-y-6">
        <PageHeader title="New Request" subtitle="Search the catalog, add products, and submit one clear material request." />
        <p className="rounded-lg border border-error/30 bg-error/5 px-3 py-2 text-sm text-error" role="alert">
          {getErrorMessage(projectsQuery.error ?? categoriesQuery.error, { context: 'load' })}
        </p>
      </section>
    )
  }

  const setItems = (items: CreateRequestFormValues['items']) => {
    setValue('items', items, { shouldDirty: true, shouldValidate: true })
  }

  const addProduct = (product: Product) => {
    setSelectedProductsById((currentProducts) => {
      const nextProducts = new Map(currentProducts)
      nextProducts.set(product.id, product)
      return nextProducts
    })

    const existingItem = watchedItems.find((item) => item.productId === product.id)

    if (existingItem) {
      updateQuantity(product.id, existingItem.quantity + 1)
      return
    }

    setItems([
      ...watchedItems,
      {
        productId: product.id,
        quantity: 1,
        availableQuantity: product.availableQuantity,
      },
    ])
  }

  const removeProduct = (productId: string) => {
    setItems(watchedItems.filter((item) => item.productId !== productId))
  }

  const updateQuantity = (productId: string, nextQuantity: number) => {
    if (nextQuantity < 1) {
      removeProduct(productId)
      return
    }

    setItems(
      watchedItems.map((item) => (item.productId === productId ? { ...item, quantity: nextQuantity } : item)),
    )
  }

  const onSubmit = async (values: CreateRequestFormValues) => {
    try {
      await createRequestMutation.mutateAsync({
        projectId: values.projectId,
        notes: values.notes,
        items: values.items.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
        })),
      })

      toast.success('Request submitted successfully')
      navigate('/employee/requests')
    } catch (error) {
      toast.error(getErrorMessage(error, { context: 'create' }))
    }
  }

  const handleCreateProject = async () => {
    const trimmedName = newProjectName.trim()

    if (!trimmedName) {
      toast.error('Project name is required.')
      return
    }

    try {
      const project = await createProjectMutation.mutateAsync({
        name: trimmedName,
        description: newProjectDescription.trim() || undefined,
      })

      setValue('projectId', project.id, { shouldValidate: true })
      setIsCreateProjectOpen(false)
      setNewProjectName('')
      setNewProjectDescription('')
      toast.success('Project created and selected.')
    } catch (error) {
      toast.error(getErrorMessage(error, { context: 'create' }))
    }
  }

  const clearFilters = () => {
    setCategoryFilter('all')
    setStockFilter('all')
    setPageIndex(0)
  }

  return (
    <section className="space-y-6 pb-24 lg:pb-0">
      <PageHeader
        title="New Request"
        subtitle="Search the catalog, add products to the tray, and submit one clear material request."
      />

      <form className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]" onSubmit={handleSubmit(onSubmit)}>
        <div className="space-y-6">
          <section className="rounded-xl border border-border bg-surface-raised p-5">
            <div className="mb-4 flex flex-col gap-1">
              <h2 className="text-lg font-semibold text-text-primary">Request details</h2>
              <p className="text-sm text-text-secondary">Choose the project first so every requested product has a clear destination.</p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <div className="mb-1.5 flex items-center justify-between gap-2">
                  <label htmlFor="projectId" className="block text-sm font-medium text-text-primary">
                    Project
                  </label>

                  <Dialog open={isCreateProjectOpen} onOpenChange={setIsCreateProjectOpen}>
                    <DialogTrigger asChild>
                      <Button type="button" variant="secondary" size="sm">
                        Create project
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Create Project</DialogTitle>
                        <DialogDescription>Add a new project and assign this request to it.</DialogDescription>
                      </DialogHeader>

                      <div className="space-y-3">
                        <div>
                          <label htmlFor="new-project-name" className="mb-1.5 block text-sm font-medium text-text-primary">
                            Project name
                          </label>
                          <Input
                            id="new-project-name"
                            value={newProjectName}
                            onChange={(event) => setNewProjectName(event.target.value)}
                            placeholder="Enter project name"
                          />
                        </div>

                        <div>
                          <label htmlFor="new-project-description" className="mb-1.5 block text-sm font-medium text-text-primary">
                            Description (optional)
                          </label>
                          <Input
                            id="new-project-description"
                            value={newProjectDescription}
                            onChange={(event) => setNewProjectDescription(event.target.value)}
                            placeholder="Add project details"
                          />
                        </div>

                        <div className="flex justify-end gap-2">
                          <Button type="button" variant="secondary" onClick={() => setIsCreateProjectOpen(false)}>
                            Cancel
                          </Button>
                          <Button type="button" disabled={createProjectMutation.isPending} onClick={handleCreateProject}>
                            {createProjectMutation.isPending ? 'Creating...' : 'Create Project'}
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>

                <Select
                  value={watchedProjectId || 'none'}
                  onValueChange={(value) => setValue('projectId', value === 'none' ? '' : value, { shouldValidate: true })}
                >
                  <SelectTrigger id="projectId">
                    <SelectValue placeholder="Select project" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Select project</SelectItem>
                    {projects
                      .filter((project) => project.isActive)
                      .map((project) => (
                        <SelectItem key={project.id} value={project.id}>
                          {project.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
                {errors.projectId ? <p className="mt-1 text-xs text-error">{errors.projectId.message}</p> : null}
              </div>

              <div>
                <label htmlFor="notes" className="mb-[5%] block text-sm font-medium text-text-primary">
                  Notes (optional)
                </label>
                <Input id="notes" placeholder="Add request details" {...register('notes')} />
                {errors.notes ? <p className="mt-1 text-xs text-error">{errors.notes.message}</p> : null}
              </div>
            </div>
          </section>

          <section className="rounded-xl border border-border bg-surface-raised">
            <div className="space-y-4 border-b border-border p-5">
              <div className="flex flex-col gap-1 md:flex-row md:items-end md:justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-text-primary">Product catalog</h2>
                  <p className="text-sm text-text-secondary">Browse products with stock context before adding them to the request tray.</p>
                </div>
                <p className="text-sm tabular-nums text-text-secondary">
                  {productsQuery.isLoading ? 'Loading products...' : `${totalProducts} products found`}
                </p>
              </div>

              <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_180px_160px]">
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-text-muted" />
                  <Input
                    value={search}
                    onChange={(event) => {
                      setSearch(event.target.value)
                      setPageIndex(0)
                    }}
                    className="pl-9"
                    placeholder="Search name, SKU, brand..."
                  />
                </div>

                <Select
                  value={categoryFilter}
                  onValueChange={(value) => {
                    setCategoryFilter(value)
                    setPageIndex(0)
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All categories</SelectItem>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select
                  value={stockFilter}
                  onValueChange={(value) => {
                    setStockFilter(value as ProductStockFilter)
                    setPageIndex(0)
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Stock" />
                  </SelectTrigger>
                  <SelectContent>
                    {(Object.keys(stockFilterLabels) as ProductStockFilter[]).map((filter) => (
                      <SelectItem key={filter} value={filter}>
                        {stockFilterLabels[filter]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {hasActiveFilters || search.trim() ? (
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1 rounded-md border border-border bg-background px-2 py-1 text-xs font-medium text-text-secondary">
                    <Filter className="size-3.5" />
                    Filtered catalog
                  </span>
                  {search.trim() ? (
                    <button
                      type="button"
                      className="inline-flex items-center gap-1 rounded-md border border-border bg-background px-2 py-1 text-xs text-text-secondary hover:text-text-primary"
                      onClick={() => {
                        setSearch('')
                        setPageIndex(0)
                      }}
                    >
                      Search: {search.trim()}
                      <X className="size-3.5" />
                    </button>
                  ) : null}
                  {hasActiveFilters ? (
                    <Button type="button" variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={clearFilters}>
                      Clear filters
                    </Button>
                  ) : null}
                </div>
              ) : null}
            </div>

            <div className="space-y-3 p-5">
              {productsQuery.isError ? (
                <p className="rounded-lg border border-error/30 bg-error/5 px-3 py-2 text-sm text-error" role="alert">
                  {getErrorMessage(productsQuery.error, { context: 'load' })}
                </p>
              ) : productsQuery.isLoading ? (
                <div className="space-y-3">
                  {Array.from({ length: 4 }).map((_, index) => (
                    <div key={index} className="h-24 animate-pulse rounded-xl border border-border bg-background" />
                  ))}
                </div>
              ) : products.length === 0 ? (
                <div className="rounded-lg border border-dashed border-border bg-background p-6 text-center">
                  <p className="text-sm font-medium text-text-primary">No products found</p>
                  <p className="mt-1 text-sm text-text-secondary">Try a different search, category, or stock filter.</p>
                </div>
              ) : (
                products.map((product) => {
                  const selectedItem = watchedItems.find((item) => item.productId === product.id)

                  return (
                    <ProductCatalogRow
                      key={product.id}
                      product={product}
                      selectedQuantity={selectedItem?.quantity ?? 0}
                      onAdd={addProduct}
                      onDecrease={(nextProduct) => updateQuantity(nextProduct.id, (selectedItem?.quantity ?? 1) - 1)}
                      onIncrease={(nextProduct) => updateQuantity(nextProduct.id, (selectedItem?.quantity ?? 0) + 1)}
                    />
                  )
                })
              )}
            </div>

            <div className="flex flex-col gap-3 border-t border-border px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
              <span className="text-sm tabular-nums text-text-secondary">
                {totalProducts === 0
                  ? '0 products'
                  : `Showing ${pageIndex * PRODUCT_PAGE_SIZE + 1} to ${Math.min((pageIndex + 1) * PRODUCT_PAGE_SIZE, totalProducts)} of ${totalProducts}`}
              </span>
              <div className="flex items-center justify-end gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  size="icon"
                  className="size-8 shadow-none"
                  disabled={pageIndex === 0 || productsQuery.isLoading}
                  onClick={() => setPageIndex((currentPage) => Math.max(0, currentPage - 1))}
                  aria-label="Go to previous product page"
                >
                  <ChevronLeft className="size-4" />
                </Button>
                <span className="px-2 text-sm tabular-nums text-text-primary">
                  {pageIndex + 1} / {pageCount}
                </span>
                <Button
                  type="button"
                  variant="secondary"
                  size="icon"
                  className="size-8 shadow-none"
                  disabled={pageIndex + 1 >= pageCount || productsQuery.isLoading}
                  onClick={() => setPageIndex((currentPage) => Math.min(pageCount - 1, currentPage + 1))}
                  aria-label="Go to next product page"
                >
                  <ChevronRight className="size-4" />
                </Button>
              </div>
            </div>
          </section>
        </div>

        <div>
          <RequestTray
            productsById={allKnownProducts}
            items={watchedItems}
            hasStockConflict={hasStockConflict}
            isSubmitting={createRequestMutation.isPending}
            canSubmit={canSubmit}
            onQuantityChange={updateQuantity}
            onRemove={removeProduct}
          />
          {errors.items?.message ? <p className="mt-2 text-xs text-error">{errors.items.message}</p> : null}
        </div>

        <div className="fixed inset-x-0 bottom-0 z-20 border-t border-border bg-surface-raised p-3 shadow-sm xl:hidden">
          <div className="mx-auto flex max-w-screen-sm items-center justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-text-primary">{watchedItems.length} products selected</p>
              <p className="text-xs text-text-secondary">Review the tray before submitting.</p>
            </div>
            <Button type="submit" disabled={!canSubmit || createRequestMutation.isPending}>
              {createRequestMutation.isPending ? 'Submitting...' : 'Submit'}
            </Button>
          </div>
        </div>
      </form>
    </section>
  )
}
