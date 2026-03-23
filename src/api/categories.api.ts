import { apiClient } from '@/api/client'
import type { CreateCategoryPayload, Category, UpdateCategoryPayload } from '@/types/category'
import type { ApiSuccessResponse } from '@/types/common'

export async function getCategories(): Promise<Category[]> {
  const { data } = await apiClient.get<ApiSuccessResponse<Category[]>>('/categories')
  return data.data
}

export async function createCategory(payload: CreateCategoryPayload): Promise<Category> {
  const { data } = await apiClient.post<ApiSuccessResponse<Category>>('/categories', payload)
  return data.data
}

export async function updateCategory(id: string, payload: UpdateCategoryPayload): Promise<Category> {
  const { data } = await apiClient.patch<ApiSuccessResponse<Category>>(`/categories/${id}`, payload)
  return data.data
}

export async function deleteCategory(id: string): Promise<Category> {
  const { data } = await apiClient.delete<ApiSuccessResponse<Category>>(`/categories/${id}`)
  return data.data
}

export async function deactivateCategory(id: string): Promise<Category> {
  const { data } = await apiClient.patch<ApiSuccessResponse<Category>>(`/categories/${id}/deactivate`)
  return data.data
}
