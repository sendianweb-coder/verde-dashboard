import { zodResolver } from '@hookform/resolvers/zod'
import { useFieldArray, useForm } from 'react-hook-form'
import { useState } from 'react'
import { toast } from 'sonner'

import { DialogFormActions } from '@/components/shared/DialogFormActions'
import { FormField } from '@/components/shared/FormField'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { useProducts } from '@/hooks/useProducts'
import { useProjects } from '@/hooks/useProjects'
import { useCreateRequest } from '@/hooks/useRequests'
import { createRequestSchema, type CreateRequestFormValues } from '@/lib/validators'

export function QuickRequestDialog() {
  const [open, setOpen] = useState(false)
  const projectsQuery = useProjects()
  const productsQuery = useProducts({ isActive: true })
  const createRequestMutation = useCreateRequest()

  const {
    control,
    register,
    handleSubmit,
    setValue,
    reset,
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
  const selectedProductIds = new Set(watchedItems.map((item) => item.productId).filter(Boolean))
  const productById = new Map(products.map((product) => [product.id, product]))

  const hasStockConflict = watchedItems.some((item) => {
    const availableQuantity = productById.get(item.productId)?.availableQuantity ?? 0
    return item.quantity > availableQuantity
  })

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
    setOpen(false)
    reset({
      projectId: '',
      notes: '',
      items: [{ productId: '', quantity: 1, availableQuantity: 0 }],
    })
  }

  const isLoadingDependencies = projectsQuery.isLoading || productsQuery.isLoading

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen)
        if (!nextOpen) {
          reset({
            projectId: '',
            notes: '',
            items: [{ productId: '', quantity: 1, availableQuantity: 0 }],
          })
        }
      }}
    >
      <DialogTrigger asChild>
        <Button type="button">New Request</Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Quick Request</DialogTitle>
          <DialogDescription>Create an internal request without leaving this page.</DialogDescription>
        </DialogHeader>

        {isLoadingDependencies ? (
          <p className="text-sm text-text-secondary">Loading projects and products...</p>
        ) : (
          <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
            <div className="grid gap-4 md:grid-cols-2">
              <FormField htmlFor="quick-projectId" label="Project" error={errors.projectId?.message}>
                <select
                  id="quick-projectId"
                  className="h-9 w-full rounded-lg border border-border bg-background px-3 text-sm text-text-primary focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-600"
                  {...register('projectId')}
                >
                  <option value="">Select project</option>
                  {projects
                    .filter((project) => project.isActive)
                    .map((project) => (
                      <option key={project.id} value={project.id}>
                        {project.name}
                      </option>
                    ))}
                </select>
              </FormField>

              <FormField htmlFor="quick-notes" label="Notes (optional)" error={errors.notes?.message}>
                <Input id="quick-notes" placeholder="Add request details" {...register('notes')} />
              </FormField>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-semibold text-text-primary">Request items</h3>
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
                  <article
                    key={field.id}
                    className="grid gap-3 rounded-lg border border-border bg-background p-3 md:grid-cols-[1fr_130px_auto]"
                  >
                    <input type="hidden" {...register(`items.${index}.productId`)} />
                    <input type="hidden" {...register(`items.${index}.availableQuantity`, { valueAsNumber: true })} />

                    <FormField
                      htmlFor={`quick-product-${index}`}
                      label="Product"
                      error={errors.items?.[index]?.productId?.message}
                    >
                      <select
                        id={`quick-product-${index}`}
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
                    </FormField>

                    <FormField
                      htmlFor={`quick-quantity-${index}`}
                      label="Quantity"
                      hint={`Available: ${availableQuantity}`}
                      error={errors.items?.[index]?.quantity?.message}
                    >
                      <Input
                        id={`quick-quantity-${index}`}
                        type="number"
                        min={1}
                        {...register(`items.${index}.quantity`, { valueAsNumber: true })}
                      />
                    </FormField>

                    <div className="flex items-end">
                      <Button type="button" variant="destructive" onClick={() => remove(index)} disabled={fields.length === 1}>
                        Remove
                      </Button>
                    </div>
                  </article>
                )
              })}
            </div>

            {hasStockConflict ? (
              <p className="rounded-lg border border-warning bg-pending-bg px-3 py-2 text-sm text-pending-text">
                One or more item quantities exceed available stock.
              </p>
            ) : null}

            <DialogFormActions
              isSubmitting={createRequestMutation.isPending}
              submitLabel="Submit Request"
              submittingLabel="Submitting..."
              onCancel={() => setOpen(false)}
            />
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
