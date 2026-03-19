import { apiClient } from '@/api/client'
import type { ApiSuccessResponse } from '@/types/common'
import type { Order, UpdateOrderStatusPayload } from '@/types/order'

export async function getOrders(): Promise<Order[]> {
  const { data } = await apiClient.get<ApiSuccessResponse<Order[]>>('/orders')
  return data.data
}

export async function getMyOrders(): Promise<Order[]> {
  const { data } = await apiClient.get<ApiSuccessResponse<Order[]>>('/orders/mine')
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
