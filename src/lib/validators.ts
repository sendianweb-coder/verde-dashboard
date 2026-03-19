import { z } from 'zod'

const roleSchema = z.enum(['ADMIN', 'STORE_KEEPER', 'EMPLOYEE'])
const orderStatusSchema = z.enum(['PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'])

export const loginSchema = z.object({
  email: z.email('Please enter a valid email address.'),
  password: z.string().min(8, 'Password must be at least 8 characters.'),
})

export const createUserSchema = z.object({
  name: z.string().min(2, 'Full name must be at least 2 characters.').max(60, 'Full name must be at most 60 characters.'),
  email: z.email('Please enter a valid email address.'),
  role: roleSchema,
  password: z.string().min(8, 'Password must be at least 8 characters.'),
})

export const updateUserSchema = createUserSchema.partial().omit({ password: true }).extend({
  password: z.string().min(8, 'Password must be at least 8 characters.').optional(),
  isActive: z.boolean().optional(),
})

export const createProductSchema = z.object({
  name: z.string().min(2, 'Product name must be at least 2 characters.').max(100, 'Product name must be at most 100 characters.'),
  sku: z.string().trim().min(1, 'SKU is required.').transform((value) => value.toUpperCase()),
  categoryId: z.string().optional(),
  price: z.number().min(0.01, 'Price must be at least 0.01.').refine((value) => Number(value.toFixed(2)) === value, 'Price can have up to 2 decimal places.'),
  stockQuantity: z.number().int().min(0, 'Initial stock quantity cannot be negative.').optional(),
  imageUrl: z.url('Image URL must be a valid URL.').optional(),
  isActive: z.boolean().optional(),
})

export const updateProductSchema = createProductSchema.partial()

export const stockAdjustmentSchema = z.object({
  delta: z.number().int(),
  note: z.string().min(5, 'Note must be at least 5 characters.').optional(),
})

export const createCategorySchema = z.object({
  name: z.string().min(2, 'Category name must be at least 2 characters.').max(50, 'Category name must be at most 50 characters.'),
  description: z.string().optional(),
  isActive: z.boolean().optional(),
})

export const createProjectSchema = z.object({
  name: z.string().min(1, 'Project name is required.'),
  description: z.string().optional(),
})

const createRequestItemSchema = z.object({
  productId: z.string().min(1, 'Product is required.'),
  quantity: z.number().int().min(1, 'Quantity must be at least 1.'),
  availableQuantity: z.number().int().min(0).optional(),
})

export const createRequestSchema =
  z.object({
    projectId: z.string().min(1, 'Project is required.'),
    notes: z.string().max(500, 'Notes must be 500 characters or less.').optional(),
    items: z.array(createRequestItemSchema).min(1, 'At least one item is required.'),
  })
  .superRefine((value, ctx) => {
    const productIds = new Set<string>()

    value.items.forEach((item, index) => {
      if (productIds.has(item.productId)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['items', index, 'productId'],
          message: 'Duplicate products are not allowed.',
        })
      }
      productIds.add(item.productId)

      if (typeof item.availableQuantity === 'number' && item.quantity > item.availableQuantity) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['items', index, 'quantity'],
          message: 'Quantity exceeds available stock.',
        })
      }
    })
  })

export const requestStatusActionSchema = z.object({
  action: z.enum(['APPROVE', 'REJECT']),
  comment: z.string().optional(),
}).superRefine((value, ctx) => {
  if (value.action === 'REJECT' && (!value.comment || value.comment.trim().length < 10)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['comment'],
      message: 'Rejection comment must be at least 10 characters.',
    })
  }
})

export const changePasswordSchema = z
  .object({
    oldPassword: z.string().min(1, 'Current password is required.'),
    newPassword: z.string().min(8, 'New password must be at least 8 characters.'),
    confirmPassword: z.string().min(1, 'Please confirm your new password.'),
  })
  .refine((value) => value.newPassword === value.confirmPassword, {
    path: ['confirmPassword'],
    message: 'Passwords do not match.',
  })

export const updateOrderStatusSchema = z.object({
  status: orderStatusSchema,
})

export type LoginFormValues = z.infer<typeof loginSchema>
export type CreateUserFormValues = z.infer<typeof createUserSchema>
export type UpdateUserFormValues = z.infer<typeof updateUserSchema>
export type CreateProductFormValues = z.infer<typeof createProductSchema>
export type UpdateProductFormValues = z.infer<typeof updateProductSchema>
export type StockAdjustmentFormValues = z.infer<typeof stockAdjustmentSchema>
export type CreateCategoryFormValues = z.infer<typeof createCategorySchema>
export type CreateProjectFormValues = z.infer<typeof createProjectSchema>
export type CreateRequestFormValues = z.infer<typeof createRequestSchema>
export type RequestStatusActionFormValues = z.infer<typeof requestStatusActionSchema>
export type ChangePasswordFormValues = z.infer<typeof changePasswordSchema>
export type UpdateOrderStatusFormValues = z.infer<typeof updateOrderStatusSchema>
