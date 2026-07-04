import { apiClient } from '@/api/client'
import type { ApiSuccessResponse, OffsetPaginatedResponse } from '@/types/common'
import type {
  CreateProductPayload,
  Product,
  ProductStockStatus,
  ResolveScannedProductsPayload,
  ResolveScannedProductsResponse,
  IntegrationSyncState,
  StockAdjustmentPayload,
  StockMovement,
  SyncWooCommerceProductsParams,
  UpdateProductPayload,
  WooCommerceSyncResponse,
} from '@/types/product'

export interface GetProductsParams {
  categoryId?: string
  featured?: 'true' | 'false'
  published?: 'true' | 'false'
  stockStatus?: ProductStockStatus
  search?: string
  limit?: number
  offset?: number
}

const MAX_PRODUCTS_PAGE_SIZE = 100

export async function getProducts(params?: GetProductsParams): Promise<OffsetPaginatedResponse<Product>> {
  const { data } = await apiClient.get<OffsetPaginatedResponse<Product>>('/products', { params })
  return data
}

export async function getAllProducts(params?: Omit<GetProductsParams, 'limit' | 'offset'>): Promise<Product[]> {
  const products: Product[] = []
  let offset = 0
  let total = 0

  do {
    const response = await getProducts({
      ...params,
      limit: MAX_PRODUCTS_PAGE_SIZE,
      offset,
    })

    products.push(...response.data)
    total = response.pagination.total
    offset += response.pagination.limit

    if (response.data.length === 0) {
      break
    }
  } while (products.length < total)

  return products
}

export async function getProductById(id: string): Promise<Product> {
  const { data } = await apiClient.get<ApiSuccessResponse<Product>>(`/products/${id}`)
  return data.data
}

export async function resolveScannedProducts(
  payload: ResolveScannedProductsPayload,
): Promise<ResolveScannedProductsResponse> {
  const { data } = await apiClient.post<ApiSuccessResponse<ResolveScannedProductsResponse>>('/products/scan/resolve', payload)
  return data.data
}

export async function createProduct(payload: CreateProductPayload): Promise<Product> {
  const { data } = await apiClient.post<ApiSuccessResponse<Product>>('/products', payload)
  return data.data
}

export async function updateProduct(id: string, payload: UpdateProductPayload): Promise<Product> {
  const { data } = await apiClient.patch<ApiSuccessResponse<Product>>(`/products/${id}`, payload)
  return data.data
}

export async function deleteProduct(id: string): Promise<void> {
  await apiClient.delete(`/products/${id}`)
}

export async function adjustStock(id: string, payload: StockAdjustmentPayload): Promise<Product> {
  const { data } = await apiClient.patch<ApiSuccessResponse<Product>>(`/products/${id}/stock`, payload)
  return data.data
}

export async function getStockMovements(id: string): Promise<StockMovement[]> {
  const { data } = await apiClient.get<ApiSuccessResponse<StockMovement[]>>(`/products/${id}/movements`)
  return data.data
}

export async function syncWooCommerceProducts(
  params?: SyncWooCommerceProductsParams,
): Promise<WooCommerceSyncResponse> {
  const { data } = await apiClient.request<ApiSuccessResponse<WooCommerceSyncResponse>>({
    method: 'post',
    url: '/products/sync/woocommerce',
    params,
  })
  return data.data
}

export async function getWooCommerceSyncStatus(): Promise<IntegrationSyncState> {
  const { data } = await apiClient.get<ApiSuccessResponse<IntegrationSyncState>>('/products/sync/woocommerce/status')
  return data.data
}

export async function deactivateProduct(id: string): Promise<void> {
  await apiClient.delete(`/products/${id}`)
}
