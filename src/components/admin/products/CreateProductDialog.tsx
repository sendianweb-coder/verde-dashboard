import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { useState } from 'react'
import { toast } from 'sonner'

import { FormField } from '@/components/shared/FormField'
import { DialogFormActions } from '@/components/shared/DialogFormActions'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useCategories } from '@/hooks/useCategories'
import { useCreateProduct } from '@/hooks/useProducts'
import { getErrorMessage } from '@/lib/errors'
import { createProductSchema, type CreateProductFormValues } from '@/lib/validators'

interface CreateProductDialogProps {
  onCreate?: () => void
  children: React.ReactNode
}

export function CreateProductDialog({ onCreate, children }: CreateProductDialogProps) {
  const [open, setOpen] = useState(false)
  const categoriesQuery = useCategories()
  const createProductMutation = useCreateProduct()

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<CreateProductFormValues>({
    resolver: zodResolver(createProductSchema),
    defaultValues: {
      name: '',
      sku: '',
      price: 0,
      categoryId: undefined,
      totalQuantity: 0,
      imageUrl: '',
    },
  })

  const watchedCategoryId = watch('categoryId')

  const onSubmit = async (values: CreateProductFormValues) => {
    try {
      const trimmedImageUrl = values.imageUrl?.trim()

      await createProductMutation.mutateAsync({
        name: values.name,
        sku: values.sku,
        price: values.price,
        categoryId: values.categoryId || undefined,
        totalQuantity: values.totalQuantity || 0,
        imageUrl: trimmedImageUrl || undefined,
      })

      toast.success('Product created successfully')
      setOpen(false)
      reset()
      onCreate?.()
    } catch (error) {
      toast.error(getErrorMessage(error, { context: 'create' }))
    }
  }

  const isLoadingDependencies = categoriesQuery.isLoading

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen)
        if (!nextOpen) {
          reset()
        }
      }}
    >
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Create Product</DialogTitle>
          <DialogDescription>Add a new product to your inventory.</DialogDescription>
        </DialogHeader>

        {isLoadingDependencies ? (
          <p className="text-sm text-text-secondary">Loading categories...</p>
        ) : categoriesQuery.isError ? (
          <p className="rounded-lg border border-error/30 bg-error/5 px-3 py-2 text-sm text-error" role="alert">
            {getErrorMessage(categoriesQuery.error, { context: 'load' })}
          </p>
        ) : (
          <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
            <div className="grid gap-4 md:grid-cols-2">
              <FormField htmlFor="create-product-name" label="Product name" error={errors.name?.message}>
                <Input
                  id="create-product-name"
                  placeholder="Enter product name"
                  disabled={createProductMutation.isPending}
                  {...register('name')}
                />
              </FormField>

              <FormField htmlFor="create-product-sku" label="SKU" error={errors.sku?.message}>
                <Input
                  id="create-product-sku"
                  placeholder="Enter product SKU"
                  disabled={createProductMutation.isPending}
                  {...register('sku')}
                />
              </FormField>

              <FormField htmlFor="create-product-price" label="Price" error={errors.price?.message}>
                <Input
                  id="create-product-price"
                  type="number"
                  min="0.01"
                  step="0.01"
                  placeholder="0.00"
                  disabled={createProductMutation.isPending}
                  {...register('price', { valueAsNumber: true })}
                />
              </FormField>

              <FormField htmlFor="create-product-stock" label="Total quantity" error={errors.totalQuantity?.message}>
                <Input
                  id="create-product-stock"
                  type="number"
                  min="0"
                  placeholder="0"
                  disabled={createProductMutation.isPending}
                  {...register('totalQuantity', { valueAsNumber: true })}
                />
              </FormField>

              <FormField htmlFor="create-product-category" label="Category (optional)" error={errors.categoryId?.message}>
                <Select 
                  value={watchedCategoryId || ''} 
                  onValueChange={(value) => {
                    setValue('categoryId', value || undefined)
                  }} 
                  disabled={createProductMutation.isPending}
                >
                  <SelectTrigger id="create-product-category">
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categoriesQuery.data?.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormField>

              <FormField htmlFor="create-product-imageUrl" label="Image URL (optional)" error={errors.imageUrl?.message}>
                <Input
                 required={false}
                  id="create-product-imageUrl"
                  placeholder="https://example.com/image.jpg"
                  disabled={createProductMutation.isPending}
                  {...register('imageUrl')}
                />
              </FormField>
            </div>

            <DialogFormActions
              isSubmitting={createProductMutation.isPending}
              submitLabel="Create Product"
              submittingLabel="Creating..."
              onCancel={() => setOpen(false)}
            />
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
