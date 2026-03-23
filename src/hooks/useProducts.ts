import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import {
  adjustStock,
  createProduct,
  deactivateProduct,
  getProductById,
  getProducts,
  getStockMovements,
  type GetProductsParams,
  updateProduct,
} from '@/api/products.api'
import type { CreateProductPayload, StockAdjustmentPayload, UpdateProductPayload } from '@/types/product'

const PRODUCTS_LIST_STALE_TIME = 60_000
const PRODUCTS_DETAIL_STALE_TIME = 30_000

export const productsQueryKeys = {
  all: ['products'] as const,
  list: (params?: GetProductsParams) => ['products', 'list', params] as const,
  detail: (id: string) => ['products', 'detail', id] as const,
  movements: (id: string) => ['products', 'movements', id] as const,
}

export function useProducts(params?: GetProductsParams) {
  return useQuery({
    queryKey: productsQueryKeys.list(params),
    queryFn: () => getProducts(params),
    staleTime: PRODUCTS_LIST_STALE_TIME,
  })
}

export function useProduct(id: string) {
  return useQuery({
    queryKey: productsQueryKeys.detail(id),
    queryFn: () => getProductById(id),
    enabled: Boolean(id),
    staleTime: PRODUCTS_DETAIL_STALE_TIME,
  })
}

export function useProductMovements(id: string) {
  return useQuery({
    queryKey: productsQueryKeys.movements(id),
    queryFn: () => getStockMovements(id),
    enabled: Boolean(id),
    staleTime: PRODUCTS_DETAIL_STALE_TIME,
  })
}

export function useCreateProduct() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: CreateProductPayload) => createProduct(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: productsQueryKeys.all })
    },
  })
}

interface UpdateProductMutationPayload {
  id: string
  payload: UpdateProductPayload
}

export function useUpdateProduct() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, payload }: UpdateProductMutationPayload) => updateProduct(id, payload),
    onSuccess: (_updatedProduct, variables) => {
      void queryClient.invalidateQueries({ queryKey: productsQueryKeys.all })
      void queryClient.invalidateQueries({ queryKey: productsQueryKeys.detail(variables.id) })
    },
  })
}

export function useDeactivateProduct() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => deactivateProduct(id),
    onSuccess: (_deactivatedProduct, id) => {
      void queryClient.invalidateQueries({ queryKey: productsQueryKeys.all })
      void queryClient.invalidateQueries({ queryKey: productsQueryKeys.detail(id) })
    },
  })
}

interface AdjustStockMutationPayload {
  id: string
  payload: StockAdjustmentPayload
}

export function useAdjustStock() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, payload }: AdjustStockMutationPayload) => adjustStock(id, payload),
    onSuccess: (_updatedProduct, variables) => {
      void queryClient.invalidateQueries({ queryKey: productsQueryKeys.all })
      void queryClient.invalidateQueries({ queryKey: productsQueryKeys.detail(variables.id) })
      void queryClient.invalidateQueries({ queryKey: productsQueryKeys.movements(variables.id) })
    },
  })
}
