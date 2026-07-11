import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { getInventoryWorkbook, saveInventoryWorkbook, saveInventoryWorkbookChanges } from '@/api/inventoryWorkbook.api'

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
