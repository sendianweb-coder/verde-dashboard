import { apiClient } from '@/api/client'
import type { ApiSuccessResponse } from '@/types/common'
import type {
  ArchiveInventoryWorkbookRowPayload,
  CreateInventoryGridProductPayload,
  InventoryGridProductResult,
  InventoryWorkbookChangesResponse,
  InventoryWorkbookImageUploadPayload,
  InventoryWorkbookImageUploadResult,
  InventoryWorkbookResponse,
  InventoryWorkbookSaveResponse,
  SaveInventoryWorkbookChangesRequest,
  SaveInventoryWorkbookRequest,
  StagedInventoryImageUploadResult,
  UploadInventoryGridProductImagePayload,
  UploadStagedInventoryImagePayload,
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

export async function archiveInventoryWorkbookRow({ rowToken }: ArchiveInventoryWorkbookRowPayload): Promise<void> {
  await apiClient.delete('/inventory/workbook/rows', { data: { rowToken } })
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

export async function createInventoryGridProduct({
  category,
  body,
}: CreateInventoryGridProductPayload): Promise<InventoryGridProductResult> {
  const { data } = await apiClient.post<ApiSuccessResponse<InventoryGridProductResult>>(
    `/inventory/${encodeURIComponent(category)}`,
    body,
  )

  return data.data
}

export async function uploadStagedInventoryImage({ image }: UploadStagedInventoryImagePayload): Promise<StagedInventoryImageUploadResult> {
  const formData = new FormData()
  formData.append('image', image)

  const { data } = await apiClient.post<ApiSuccessResponse<StagedInventoryImageUploadResult>>(
    '/inventory/images/staged',
    formData,
    { headers: { 'Content-Type': undefined } },
  )

  return data.data
}

export async function uploadInventoryGridProductImage({
  category,
  id,
  image,
}: UploadInventoryGridProductImagePayload): Promise<InventoryGridProductResult> {
  const formData = new FormData()
  formData.append('image', image)

  const { data } = await apiClient.post<ApiSuccessResponse<InventoryGridProductResult>>(
    `/inventory/${encodeURIComponent(category)}/${encodeURIComponent(id)}/image`,
    formData,
    { headers: { 'Content-Type': undefined } },
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
