import { useQuery } from '@tanstack/react-query'

import { getInventoryWorkbook } from '@/api/inventoryWorkbook.api'

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
