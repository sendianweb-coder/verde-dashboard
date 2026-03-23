import { apiClient } from '@/api/client'
import type { ApiSuccessResponse } from '@/types/common'
import type { Order, UpdateOrderStatusPayload } from '@/types/order'

export interface GetOrdersParams {
  status?: Order['status']
  customerId?: string
  search?: string
  from?: string
  to?: string
  page?: number
  limit?: number
}

export async function getOrders(params?: GetOrdersParams): Promise<Order[]> {
  const { data } = await apiClient.get<ApiSuccessResponse<Order[]>>('/orders', { params })
  return data.data
}

export async function getMyOrders(params?: Pick<GetOrdersParams, 'status' | 'page' | 'limit'>): Promise<Order[]> {
  const { data } = await apiClient.get<ApiSuccessResponse<Order[]>>('/orders/mine', { params })
  return data.data
}

export async function getOrderById(id: string): Promise<Order> {
  const { data } = await apiClient.get<ApiSuccessResponse<Order>>(`/orders/${id}`)
  return data.data
}

export async function updateOrderStatus(id: string, payload: UpdateOrderStatusPayload): Promise<Order> {
  const { data } = await apiClient.patch<ApiSuccessResponse<Order>>(`/orders/${id}/status`, payload)
  return data.data
}
