import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { getMyOrders, getOrderById, getOrders, type GetOrdersParams, updateOrderStatus } from '@/api/orders.api'
import type { UpdateOrderStatusPayload } from '@/types/order'

const ORDERS_LIST_STALE_TIME = 60_000
const ORDERS_DETAIL_STALE_TIME = 30_000

type MyOrdersParams = Pick<GetOrdersParams, 'status' | 'page' | 'limit'>

export const ordersQueryKeys = {
  all: ['orders'] as const,
  list: (params?: GetOrdersParams) => ['orders', 'list', params] as const,
  mine: (params?: MyOrdersParams) => ['orders', 'mine', params] as const,
  detail: (id: string) => ['orders', 'detail', id] as const,
}

export function useOrders(params?: GetOrdersParams, enabled = true) {
  return useQuery({
    queryKey: ordersQueryKeys.list(params),
    queryFn: () => getOrders(params),
    enabled,
    staleTime: ORDERS_LIST_STALE_TIME,
  })
}

export function useMyOrders(params?: MyOrdersParams) {
  return useQuery({
    queryKey: ordersQueryKeys.mine(params),
    queryFn: () => getMyOrders(params),
    staleTime: ORDERS_LIST_STALE_TIME,
  })
}

export function useOrder(id: string) {
  return useQuery({
    queryKey: ordersQueryKeys.detail(id),
    queryFn: () => getOrderById(id),
    enabled: Boolean(id),
    staleTime: ORDERS_DETAIL_STALE_TIME,
  })
}

interface UpdateOrderStatusMutationPayload {
  id: string
  payload: UpdateOrderStatusPayload
}

export function useUpdateOrderStatus() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, payload }: UpdateOrderStatusMutationPayload) => updateOrderStatus(id, payload),
    onSuccess: (_updatedOrder, variables) => {
      void queryClient.invalidateQueries({ queryKey: ordersQueryKeys.all })
      void queryClient.invalidateQueries({ queryKey: ordersQueryKeys.detail(variables.id) })
    },
  })
}
