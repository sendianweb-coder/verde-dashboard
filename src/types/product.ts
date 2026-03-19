export type StockMovementType = 'PURCHASE' | 'CUSTOMER_ORDER' | 'INTERNAL_USE' | 'ADJUSTMENT' | 'RETURN'

export interface ProductCategoryRef {
  id: string
  name: string
}

export interface Product {
  id: string
  woocommerceId: number | null
  name: string
  sku: string
  price: string
  stockQuantity: number
  reservedQuantity: number
  availableQuantity: number
  categoryId: string | null
  category: ProductCategoryRef | null
  imageUrl: string | null
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface StockMovement {
  id: string
  productId: string
  type: StockMovementType
  delta: number
  referenceId: string | null
  note: string | null
  createdAt: string
}

export interface CreateProductPayload {
  name: string
  sku: string
  price: number
  categoryId?: string
  stockQuantity?: number
  imageUrl?: string
}

export interface UpdateProductPayload {
  name?: string
  sku?: string
  price?: number
  categoryId?: string | null
  isActive?: boolean
  imageUrl?: string
}

export interface StockAdjustmentPayload {
  delta: number
  note?: string
}
