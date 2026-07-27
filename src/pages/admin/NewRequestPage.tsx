import { zodResolver } from '@hookform/resolvers/zod'
import { ChevronLeft, ChevronRight, Filter, QrCode, Search, X } from 'lucide-react'
import { useDeferredValue, useMemo, useRef, useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'

import { PageHeader } from '@/components/layout/PageHeader'
import { PageSkeleton } from '@/components/shared/PageSkeleton'
import { ProjectOptionSelect } from '@/components/shared/ProjectOptionSelect'
import { ProductScanSheet } from '@/components/shared/ProductScanSheet'
import { ProductCatalogRow, RequestTray, type RequestTrayProduct } from '@/components/shared/RequestCatalog'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useCategories } from '@/hooks/useCategories'
import { usePaginatedProducts } from '@/hooks/useProducts'
import { useCreateProject } from '@/hooks/useProjects'
import { useCreateRequest } from '@/hooks/useRequests'
import { getErrorMessage } from '@/lib/errors'
import { stockFilterLabels, type ProductStockFilter } from '@/lib/requestCatalog'
import { createRequestSchema, type CreateRequestFormValues } from '@/lib/validators'
import type { Product, ResolvedScanItem } from '@/types/product'

const PRODUCT_PAGE_SIZE = 12
const EMPTY_PRODUCTS: Product[] = []
const EMPTY_REQUEST_ITEMS: CreateRequestFormValues['items'] = []

export function AdminNewRequestPage() {
  const navigate = useNavigate()
  const [isCreateProjectOpen, setIsCreateProjectOpen] = useState(false)
  const [newProjectName, setNewProjectName] = useState('')
  const [newProjectDescription, setNewProjectDescription] = useState('')
  const [selectedProject, setSelectedProject] = useState<{ id: string; name: string } | null>(null)
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [stockFilter, setStockFilter] = useState<ProductStockFilter>('all')
  const [pageIndex, setPageIndex] = useState(0)
  const [selectedProductsById, setSelectedProductsById] = useState<Map<string, RequestTrayProduct>>(() => new Map())
  const [isScanSheetOpen, setIsScanSheetOpen] = useState(false)
  const [highlightedProductId, setHighlightedProductId] = useState<string | null>(null)
  const highlightTimeoutRef = useRef<number | null>(null)
  const deferredSearch = useDeferredValue(search)

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

  const categories = categoriesQuery.data ?? []
  const products = productsQuery.data?.data ?? EMPTY_PRODUCTS
  const totalProducts = productsQuery.data?.pagination.total ?? 0
  const pageCount = Math.max(1, Math.ceil(totalProducts / PRODUCT_PAGE_SIZE))
  const watchedItems = watchedItemsValue ?? EMPTY_REQUEST_ITEMS
  const selectedProductIds = useMemo(() => new Set(watchedItems.map((item) => item.productId)), [watchedItems])
  const hasActiveFilters = categoryFilter !== 'all' || stockFilter !== 'all'

  const allKnownProducts = useMemo(() => {
    const productMap = new Map(selectedProductsById)

    products.forEach((product) => {
      productMap.set(product.id, product)
    })

    return productMap
  }, [products, selectedProductsById])

  const hasStockConflict = watchedItems.some((item) => {
    const availableQuantity = allKnownProducts.get(item.productId)?.availableQuantity ?? item.availableQuantity ?? 0
    return item.quantity > availableQuantity
  })
  const canSubmit = Boolean(watchedProjectId) && watchedItems.length > 0 && !hasStockConflict

  if (categoriesQuery.isLoading) {
    return <PageSkeleton />
  }

  if (categoriesQuery.isError) {
    return (
      <section className="space-y-6">
        <PageHeader title="New Request" subtitle="Create an operational request from the admin workspace." />
        <p className="rounded-lg border border-error/30 bg-error/5 px-3 py-2 text-sm text-error" role="alert">
          {getErrorMessage(categoriesQuery.error, { context: 'load' })}
        </p>
      </section>
    )
  }

  const setItems = (items: CreateRequestFormValues['items']) => {
    setValue('items', items, { shouldDirty: true, shouldValidate: true })
  }

  const addProduct = (product: Product) => {
    if (!product.isActive || product.availableQuantity <= 0) {
      toast.error('This product is currently unavailable for requests.')
      return
    }

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

    const currentAvailableQuantity = allKnownProducts.get(productId)?.availableQuantity

    if (typeof currentAvailableQuantity === 'number' && currentAvailableQuantity <= 0) {
      removeProduct(productId)
      toast.error('This product is no longer available for requests.')
      return
    }

    setItems(
      watchedItems.map((item) => {
        if (item.productId !== productId) {
          return item
        }

        const availableQuantity = currentAvailableQuantity ?? item.availableQuantity
        const quantity = typeof availableQuantity === 'number' && availableQuantity >= 1 ? Math.min(nextQuantity, availableQuantity) : nextQuantity

        return { ...item, quantity, availableQuantity }
      }),
    )
  }

  const highlightProduct = (productId: string) => {
    setHighlightedProductId(productId)

    if (highlightTimeoutRef.current) {
      window.clearTimeout(highlightTimeoutRef.current)
    }

    highlightTimeoutRef.current = window.setTimeout(() => {
      setHighlightedProductId((currentProductId) => (currentProductId === productId ? null : currentProductId))
      highlightTimeoutRef.current = null
    }, 1800)
  }

  const handleResolvedScanItems = (scanItems: ResolvedScanItem[]) => {
    const resolvedItems = scanItems.filter((item) => item.status === 'RESOLVED' && item.product)

    if (resolvedItems.length === 0) {
      return
    }

    setSelectedProductsById((currentProducts) => {
      const nextProducts = new Map(currentProducts)

      resolvedItems.forEach((item) => {
        if (item.product) {
          nextProducts.set(item.product.id, item.product)
        }
      })

      return nextProducts
    })

    const currentProductIds = new Set(watchedItems.map((item) => item.productId))
    const newItems = resolvedItems
      .map((item) => item.product)
      .filter((product): product is RequestTrayProduct => Boolean(product))
      .filter((product) => !currentProductIds.has(product.id))
      .map((product) => ({
        productId: product.id,
        quantity: 1,
        availableQuantity: product.availableQuantity,
      }))

    const firstResolvedProduct = resolvedItems[0]?.product

    if (newItems.length > 0) {
      setItems([...watchedItems, ...newItems])
    }

    if (firstResolvedProduct) {
      highlightProduct(firstResolvedProduct.id)
    }
  }

  const onSubmit = async (values: CreateRequestFormValues) => {
    const hasUnavailableItem = values.items.some((item) => {
      const availableQuantity = allKnownProducts.get(item.productId)?.availableQuantity ?? item.availableQuantity ?? 0
      return availableQuantity <= 0 || item.quantity > availableQuantity
    })

    if (hasUnavailableItem) {
      toast.error('One or more requested products are no longer available. Update the request tray and try again.')
      return
    }

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
      navigate('/admin/requests')
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

      setSelectedProject({ id: project.id, name: project.name })
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
    <section className="space-y-6 pb-24 xl:pb-0">
      <PageHeader
        title="New Request"
        subtitle="Scan QR codes or search the catalog, then choose a project before submitting."
        action={
          <Button type="button" onClick={() => setIsScanSheetOpen(true)}>
            <QrCode className="size-4" />
            Scan QR
          </Button>
        }
      />

      <form className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]" onSubmit={handleSubmit(onSubmit)}>
        <div className="space-y-6">
          <section className="rounded-xl border border-border bg-surface-raised p-5">
            <div className="mb-4 flex flex-col gap-1">
              <h2 className="text-lg font-semibold text-text-primary">Request details</h2>
              <p className="text-sm text-text-secondary">You can scan products first, then choose the project before submitting.</p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <div className="mb-1.5 flex items-center justify-between gap-2">
                  <label htmlFor="admin-projectId" className="block text-sm font-medium text-text-primary">
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
                          <label htmlFor="admin-new-project-name" className="mb-1.5 block text-sm font-medium text-text-primary">
                            Project name
                          </label>
                          <Input
                            id="admin-new-project-name"
                            value={newProjectName}
                            onChange={(event) => setNewProjectName(event.target.value)}
                            placeholder="Enter project name"
                          />
                        </div>

                        <div>
                          <label htmlFor="admin-new-project-description" className="mb-1.5 block text-sm font-medium text-text-primary">
                            Description (optional)
                          </label>
                          <Input
                            id="admin-new-project-description"
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

                <ProjectOptionSelect
                  id="admin-projectId"
                  value={watchedProjectId}
                  selectedOption={selectedProject}
                  onChange={(option) => {
                    setSelectedProject(option)
                    setValue('projectId', option?.id ?? '', { shouldValidate: true })
                  }}
                />
                {errors.projectId ? <p className="mt-1 text-xs text-error">{errors.projectId.message}</p> : null}
              </div>

              <div>
                <label htmlFor="admin-notes" className="mb-1.5 block text-sm font-medium text-text-primary">
                  Notes (optional)
                </label>
                <Input id="admin-notes" placeholder="Add request details" {...register('notes')} />
                {errors.notes ? <p className="mt-1 text-xs text-error">{errors.notes.message}</p> : null}
              </div>
            </div>
          </section>

          <section className="rounded-xl border border-border bg-surface-raised">
            <div className="space-y-4 border-b border-border p-5">
              <div className="flex flex-col gap-1 md:flex-row md:items-end md:justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-text-primary">Product catalog</h2>
                  <p className="text-sm text-text-secondary">Scan QR labels or browse products with stock context before adding them to the request tray.</p>
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
                      onQuantityChange={(nextProduct, quantity) => updateQuantity(nextProduct.id, quantity)}
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
            highlightedProductId={highlightedProductId}
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

      <ProductScanSheet
        open={isScanSheetOpen}
        selectedProductIds={selectedProductIds}
        onOpenChange={setIsScanSheetOpen}
        onResolvedItems={handleResolvedScanItems}
      />
    </section>
  )
}
