import { apiClient } from '@/api/client'
import type { ApiSuccessResponse } from '@/types/common'
import type { InventoryWorkbookResponse } from '@/types/inventoryWorkbook'

interface GetInventoryWorkbookOptions {
  category?: string
  categories?: 'all'
}

export async function getInventoryWorkbook({
  category,
  categories = 'all',
}: GetInventoryWorkbookOptions = {}): Promise<InventoryWorkbookResponse> {
  const { data } = await apiClient.get<ApiSuccessResponse<InventoryWorkbookResponse>>('/inventory/workbook', {
    params: category ? { category } : { categories },
  })

  return data.data
}
