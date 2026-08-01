import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { createCategory } from '@/api/categories.api'
import {
  archiveInventoryWorkbookRow,
  createInventoryGridProduct,
  getInventoryWorkbook,
  saveInventoryWorkbook,
  saveInventoryWorkbookChanges,
  uploadInventoryGridProductImage,
  uploadStagedInventoryImage,
  uploadInventoryWorkbookImage,
} from '@/api/inventoryWorkbook.api'
import { categoriesQueryKeys } from '@/hooks/useCategories'
import { productsQueryKeys } from '@/hooks/useProducts'
import type {
  ArchiveInventoryWorkbookRowPayload,
  CreateInventoryGridProductPayload,
  InventoryWorkbookImageUploadPayload,
  UploadInventoryGridProductImagePayload,
  UploadStagedInventoryImagePayload,
} from '@/types/inventoryWorkbook'
import type { CreateCategoryPayload } from '@/types/category'

const INVENTORY_WORKBOOK_STALE_TIME = 30_000

export const inventoryWorkbookQueryKeys = {
  all: ['inventory-workbook'] as const,
  category: (category: string) => ['inventory-workbook', 'category', category] as const,
}

export function useInventoryWorkbook(category?: string) {
  return useQuery({
    queryKey: category ? inventoryWorkbookQueryKeys.category(category) : inventoryWorkbookQueryKeys.all,
    queryFn: () => getInventoryWorkbook(category ? { category } : { categories: 'all' }),
    enabled: category === undefined || Boolean(category),
    staleTime: INVENTORY_WORKBOOK_STALE_TIME,
  })
}

const markInventoryCachesStale = (queryClient: ReturnType<typeof useQueryClient>) => {
  void Promise.all([
    queryClient.invalidateQueries({ queryKey: inventoryWorkbookQueryKeys.all, refetchType: 'none' }),
    queryClient.invalidateQueries({ queryKey: productsQueryKeys.all, refetchType: 'none' }),
    queryClient.invalidateQueries({ queryKey: categoriesQueryKeys.all, refetchType: 'none' }),
  ])
}

export function useArchiveInventoryWorkbookRow() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: ArchiveInventoryWorkbookRowPayload) => archiveInventoryWorkbookRow(payload),
    retry: false,
    onSuccess: () => markInventoryCachesStale(queryClient),
  })
}

export function useCreateInventoryGridProduct() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: CreateInventoryGridProductPayload) => createInventoryGridProduct(payload),
    retry: false,
    onSuccess: () => markInventoryCachesStale(queryClient),
  })
}

export function useUploadStagedInventoryImage() {
  return useMutation({
    mutationFn: (payload: UploadStagedInventoryImagePayload) => uploadStagedInventoryImage(payload),
    retry: false,
  })
}

export function useUploadInventoryGridProductImage() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: UploadInventoryGridProductImagePayload) => uploadInventoryGridProductImage(payload),
    retry: false,
    onSuccess: () => markInventoryCachesStale(queryClient),
  })
}

export function useCreateInventoryGridCategory() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: CreateCategoryPayload) => createCategory(payload),
    retry: false,
    onSuccess: () => markInventoryCachesStale(queryClient),
  })
}

export function useUploadInventoryWorkbookImage() {
  return useMutation({
    mutationFn: (payload: InventoryWorkbookImageUploadPayload) => uploadInventoryWorkbookImage(payload),
    retry: false,
  })
}

export function useSaveInventoryWorkbook() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: saveInventoryWorkbook,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: inventoryWorkbookQueryKeys.all })
    },
  })
}

export function useSaveInventoryWorkbookChanges() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: saveInventoryWorkbookChanges,
    retry: (failureCount, error: unknown) => {
      const status = typeof error === 'object' && error !== null && 'response' in error
        ? (error as { response?: { status?: number } }).response?.status
        : undefined

      if (status && status < 500) {
        return false
      }

      return failureCount < 2
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 5000),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: inventoryWorkbookQueryKeys.all })
    },
  })
}
