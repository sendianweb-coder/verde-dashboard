import { zodResolver } from '@hookform/resolvers/zod'
import { useFieldArray, useForm } from 'react-hook-form'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'

import { PageHeader } from '@/components/layout/PageHeader'
import { PageSkeleton } from '@/components/shared/PageSkeleton'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useProducts } from '@/hooks/useProducts'
import { useProjects } from '@/hooks/useProjects'
import { useCreateRequest } from '@/hooks/useRequests'
import { createRequestSchema, type CreateRequestFormValues } from '@/lib/validators'

export function EmployeeNewRequestPage() {
  const navigate = useNavigate()
  const projectsQuery = useProjects()
  const productsQuery = useProducts({ isActive: true })
  const createRequestMutation = useCreateRequest()

  const {
    control,
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CreateRequestFormValues>({
    resolver: zodResolver(createRequestSchema),
    defaultValues: {
      projectId: '',
      notes: '',
      items: [{ productId: '', quantity: 1, availableQuantity: 0 }],
    },
  })

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'items',
  })

  const projects = projectsQuery.data ?? []
  const products = productsQuery.data ?? []
  const watchedItems = watch('items') ?? []

  const productById = new Map(products.map((product) => [product.id, product]))

  const hasStockConflict = watchedItems.some((item) => {
    const availableQuantity = productById.get(item.productId)?.availableQuantity ?? 0
    return item.quantity > availableQuantity
  })

  const selectedProductIds = new Set(watchedItems.map((item) => item.productId).filter(Boolean))

  if (projectsQuery.isLoading || productsQuery.isLoading) {
    return <PageSkeleton />
  }

  const onSubmit = async (values: CreateRequestFormValues) => {
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
  }

  return (
    <section className="space-y-6">
      <PageHeader title="New Request" subtitle="Select a project and add the products you need" />

      <form className="space-y-6 rounded-xl border border-border bg-surface-raised p-6" onSubmit={handleSubmit(onSubmit)}>
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label htmlFor="projectId" className="mb-1.5 block text-sm font-medium text-text-primary">
              Project
            </label>
            <select
              id="projectId"
              className="h-9 w-full rounded-lg border border-border bg-background px-3 text-sm text-text-primary focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-600"
              {...register('projectId')}
            >
              <option value="">Select project</option>
              {projects.filter((project) => project.isActive).map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>
            {errors.projectId ? <p className="mt-1 text-xs text-error">{errors.projectId.message}</p> : null}
          </div>

          <div>
            <label htmlFor="notes" className="mb-1.5 block text-sm font-medium text-text-primary">
              Notes (optional)
            </label>
            <Input id="notes" placeholder="Add request details" {...register('notes')} />
            {errors.notes ? <p className="mt-1 text-xs text-error">{errors.notes.message}</p> : null}
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-text-primary">Request items</h2>
            <Button
              type="button"
              variant="secondary"
              onClick={() => append({ productId: '', quantity: 1, availableQuantity: 0 })}
            >
              Add Item
            </Button>
          </div>

          {fields.map((field, index) => {
            const selectedProductId = watchedItems[index]?.productId
            const selectedProduct = selectedProductId ? productById.get(selectedProductId) : null
            const availableQuantity = selectedProduct?.availableQuantity ?? 0

            return (
              <div key={field.id} className="grid gap-3 rounded-lg border border-border bg-background p-3 md:grid-cols-[1fr_160px_auto]">
                <input type="hidden" {...register(`items.${index}.productId`)} />
                <input type="hidden" {...register(`items.${index}.availableQuantity`, { valueAsNumber: true })} />
                <div>
                  <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-text-secondary" htmlFor={`product-${index}`}>
                    Product
                  </label>
                  <select
                    id={`product-${index}`}
                    className="h-9 w-full rounded-lg border border-border bg-background px-3 text-sm text-text-primary focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-600"
                    value={selectedProductId ?? ''}
                    onChange={(event) => {
                      const productId = event.target.value
                      const product = productById.get(productId)

                      setValue(`items.${index}.productId`, productId, { shouldValidate: true })
                      setValue(`items.${index}.availableQuantity`, product?.availableQuantity ?? 0, { shouldValidate: true })
                    }}
                  >
                    <option value="">Select product</option>
                    {products
                      .filter((product) => {
                        if (!product.isActive) {
                          return false
                        }

                        return product.id === selectedProductId || !selectedProductIds.has(product.id)
                      })
                      .map((product) => (
                        <option key={product.id} value={product.id}>
                          {product.name}
                        </option>
                      ))}
                  </select>
                  {errors.items?.[index]?.productId ? (
                    <p className="mt-1 text-xs text-error">{errors.items[index]?.productId?.message}</p>
                  ) : null}
                </div>

                <div>
                  <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-text-secondary" htmlFor={`quantity-${index}`}>
                    Quantity
                  </label>
                  <Input id={`quantity-${index}`} type="number" min={1} {...register(`items.${index}.quantity`, { valueAsNumber: true })} />
                  <p className="mt-1 text-xs text-text-secondary">Available: {availableQuantity}</p>
                  {errors.items?.[index]?.quantity ? (
                    <p className="mt-1 text-xs text-error">{errors.items[index]?.quantity?.message}</p>
                  ) : null}
                </div>

                <div className="flex items-end">
                  <Button
                    type="button"
                    variant="destructive"
                    onClick={() => remove(index)}
                    disabled={fields.length === 1}
                  >
                    Remove
                  </Button>
                </div>
              </div>
            )
          })}
        </div>

        {hasStockConflict ? (
          <p className="rounded-lg border border-warning bg-pending-bg px-3 py-2 text-sm text-pending-text">
            One or more item quantities exceed available stock.
          </p>
        ) : null}

        <div className="flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={() => navigate('/employee/requests')}>
            Cancel
          </Button>
          <Button type="submit" disabled={createRequestMutation.isPending || hasStockConflict || watchedItems.length === 0}>
            {createRequestMutation.isPending ? 'Submitting...' : 'Submit Request'}
          </Button>
        </div>
      </form>
    </section>
  )
}
