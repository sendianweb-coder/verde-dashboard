export type StockMovementType = 'PURCHASE' | 'CUSTOMER_ORDER' | 'INTERNAL_USE' | 'ADJUSTMENT' | 'RETURN'
export type ProductStockStatus = 'instock' | 'outofstock'
export type ProductCatalogVisibility = 'visible' | 'hidden'

export type ProductRecord = Record<string, unknown>

export interface ProductCategoryRef {
  id: string
  name: string
}

export interface Product {
  id: string
  woocommerceId: number | null
  name: string
  sku: string
  slug: string | null
  description: string | null
  shortDescription: string | null
  price: string
  regularPrice: number | null
  salePrice: number | null
  stockQuantity: number
  reservedQuantity: number
  availableQuantity: number
  stockStatus: ProductStockStatus
  lowStockAmount: number | null
  backordersAllowed: boolean
  categoryId: string | null
  category: ProductCategoryRef | null
  imageUrl: string | null
  isActive: boolean
  published: boolean
  featured: boolean
  catalogVisibility: ProductCatalogVisibility
  tags: string | null
  brand: string | null
  height: string | null
  potSize: string | null
  unitOfMeasure: string | null
  latinName: string | null
  shape: string | null
  origin: string | null
  colorType: string | null
  potType: string | null
  weightKg: number | null
  lengthCm: number | null
  widthCm: number | null
  heightCm: number | null
  position: number | null
  allowReviews: boolean
  purchaseNote: string | null
  shippingClass: string | null
  attributes: ProductRecord | null
  meta: ProductRecord | null
  lastSyncedAt: string | null
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

export interface SyncError {
  woocommerceId: number | null
  sku: string | null
  message: string
}

export interface WooCommerceSyncResponse {
  processed: number
  created: number
  updated: number
  skipped: number
  failed: number
  errors: SyncError[]
}

export interface IntegrationSyncState {
  id: string
  provider: 'woocommerce'
  lastFullSyncAt: string | null
  lastWebhookAt: string | null
  lastSuccessfulRunAt: string | null
  lastErrorAt: string | null
  lastErrorMessage: string | null
  failedItemsCount: number
  createdAt: string
  updatedAt: string
}

export interface SyncWooCommerceProductsParams {
  modifiedAfter?: string
}

export interface CreateProductPayload {
  name: string
  sku: string
  price?: number
  categoryId?: string
  stockQuantity?: number
  imageUrl?: string
  woocommerceId?: number
  description?: string
  shortDescription?: string
  regularPrice?: number
  salePrice?: number | null
  stockStatus?: ProductStockStatus
  lowStockAmount?: number | null
  backordersAllowed?: boolean
  published?: boolean
  featured?: boolean
  catalogVisibility?: ProductCatalogVisibility
  tags?: string
  brand?: string
  height?: string
  potSize?: string
  unitOfMeasure?: string
  latinName?: string
  shape?: string
  origin?: string
  colorType?: string
  potType?: string
  weightKg?: number | null
  lengthCm?: number | null
  widthCm?: number | null
  heightCm?: number | null
  position?: number | null
  allowReviews?: boolean
  purchaseNote?: string
  shippingClass?: string
}

export interface UpdateProductPayload {
  name?: string
  sku?: string
  price?: number
  categoryId?: string | null
  isActive?: boolean
  imageUrl?: string
  description?: string
  shortDescription?: string
  regularPrice?: number
  salePrice?: number | null
  stockQuantity?: number
  stockStatus?: ProductStockStatus
  lowStockAmount?: number | null
  backordersAllowed?: boolean
  published?: boolean
  featured?: boolean
  catalogVisibility?: ProductCatalogVisibility
  tags?: string
  brand?: string
  height?: string
  potSize?: string
  unitOfMeasure?: string
  latinName?: string
  shape?: string
  origin?: string
  colorType?: string
  potType?: string
  weightKg?: number | null
  lengthCm?: number | null
  widthCm?: number | null
  heightCm?: number | null
  position?: number | null
  allowReviews?: boolean
  purchaseNote?: string
  shippingClass?: string
}

export interface StockAdjustmentPayload {
  delta: number
  note?: string
}
