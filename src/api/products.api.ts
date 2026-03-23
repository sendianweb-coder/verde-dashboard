import { apiClient } from '@/api/client'
import type { ApiSuccessResponse } from '@/types/common'
import type { CreateProductPayload, Product, StockAdjustmentPayload, StockMovement, UpdateProductPayload } from '@/types/product'

export interface GetProductsParams {
  categoryId?: string
  search?: string
  isActive?: boolean
  page?: number
  limit?: number
}

export async function getProducts(params?: GetProductsParams): Promise<Product[]> {
  const { data } = await apiClient.get<ApiSuccessResponse<Product[]>>('/products', { params })
  return data.data
}

export async function getProductById(id: string): Promise<Product> {
  const { data } = await apiClient.get<ApiSuccessResponse<Product>>(`/products/${id}`)
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

export async function deleteProduct(id: string): Promise<Product> {
  const { data } = await apiClient.delete<ApiSuccessResponse<Product>>(`/products/${id}`)
  return data.data
}

export async function adjustStock(id: string, payload: StockAdjustmentPayload): Promise<Product> {
  const { data } = await apiClient.patch<ApiSuccessResponse<Product>>(`/products/${id}/stock`, payload)
  return data.data
}

export async function getStockMovements(id: string): Promise<StockMovement[]> {
  const { data } = await apiClient.get<ApiSuccessResponse<StockMovement[]>>(`/products/${id}/movements`)
  return data.data
}

export async function deactivateProduct(id: string): Promise<Product> {
  const { data } = await apiClient.patch<ApiSuccessResponse<Product>>(`/products/${id}/deactivate`)
  return data.data
}
