import { apiClient } from '@/api/client'
import type { ApiSuccessResponse } from '@/types/common'
import type {
  InventoryWorkbookChangesResponse,
  InventoryWorkbookImageUploadPayload,
  InventoryWorkbookImageUploadResult,
  InventoryWorkbookResponse,
  InventoryWorkbookSaveResponse,
  SaveInventoryWorkbookChangesRequest,
  SaveInventoryWorkbookRequest,
} from '@/types/inventoryWorkbook'

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

export async function uploadInventoryWorkbookImage({
  rowToken,
  image,
}: InventoryWorkbookImageUploadPayload): Promise<InventoryWorkbookImageUploadResult> {
  const formData = new FormData()
  formData.append('rowToken', rowToken)
  formData.append('image', image)

  const { data } = await apiClient.post<ApiSuccessResponse<InventoryWorkbookImageUploadResult>>(
    '/inventory/workbook/images',
    formData,
    {
      // The shared client defaults JSON requests to application/json. Clear that
      // default so Axios preserves the FormData and the browser supplies its
      // multipart boundary.
      headers: { 'Content-Type': undefined },
    },
  )

  return data.data
}

export async function saveInventoryWorkbook(payload: SaveInventoryWorkbookRequest): Promise<InventoryWorkbookSaveResponse> {
  const { data } = await apiClient.post<ApiSuccessResponse<InventoryWorkbookSaveResponse>>('/inventory/workbook', payload)

  return data.data
}

export async function saveInventoryWorkbookChanges(
  payload: SaveInventoryWorkbookChangesRequest,
): Promise<InventoryWorkbookChangesResponse> {
  const { data } = await apiClient.patch<ApiSuccessResponse<InventoryWorkbookChangesResponse>>('/inventory/workbook/changes', payload)

  return data.data
}
