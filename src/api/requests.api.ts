import { apiClient } from '@/api/client'
import type { ApiSuccessResponse } from '@/types/common'
import type {
  AdjustItemsPayload,
  ApprovalEvent,
  ApproveRequestPayload,
  CreateRequestPayload,
  InternalRequest,
  PickupRequestPayload,
  RequestStatusActionPayload,
  ReturnRequestPayload,
  UpdateRequestPayload,
} from '@/types/request'

export interface GetRequestsParams {
  status?: InternalRequest['status']
  projectId?: string
  requesterId?: string
  from?: string
  to?: string
  page?: number
  limit?: number
}

export async function getRequests(params?: GetRequestsParams): Promise<InternalRequest[]> {
  const { data } = await apiClient.get<ApiSuccessResponse<InternalRequest[]>>('/requests', { params })
  return data.data
}

export async function getMyRequests(params?: Pick<GetRequestsParams, 'status' | 'page' | 'limit'>): Promise<InternalRequest[]> {
  const { data } = await apiClient.get<ApiSuccessResponse<InternalRequest[]>>('/requests/mine', { params })
  return data.data
}

export async function getRequestById(id: string): Promise<InternalRequest> {
  const { data } = await apiClient.get<ApiSuccessResponse<InternalRequest>>(`/requests/${id}`)
  return data.data
}

export async function createRequest(payload: CreateRequestPayload): Promise<InternalRequest> {
  const { data } = await apiClient.post<ApiSuccessResponse<InternalRequest>>('/requests', payload)
  return data.data
}

export async function updateRequest(id: string, payload: UpdateRequestPayload): Promise<InternalRequest> {
  const { data } = await apiClient.patch<ApiSuccessResponse<InternalRequest>>(`/requests/${id}`, payload)
  return data.data
}

export async function approveRequest(id: string, payload: ApproveRequestPayload): Promise<InternalRequest> {
  const { data } = await apiClient.post<ApiSuccessResponse<InternalRequest>>(`/requests/${id}/approve`, payload)
  return data.data
}

export async function rejectRequest(id: string, payload: RequestStatusActionPayload): Promise<InternalRequest> {
  const { data } = await apiClient.post<ApiSuccessResponse<InternalRequest>>(`/requests/${id}/reject`, payload)
  return data.data
}

export async function pickupRequest(id: string, payload: PickupRequestPayload): Promise<InternalRequest> {
  const { data } = await apiClient.post<ApiSuccessResponse<InternalRequest>>(`/requests/${id}/pickup`, payload)
  return data.data
}

export async function returnRequest(id: string, payload: ReturnRequestPayload): Promise<InternalRequest> {
  const { data } = await apiClient.post<ApiSuccessResponse<InternalRequest>>(`/requests/${id}/return`, payload)
  return data.data
}

export async function completeRequest(id: string, payload: RequestStatusActionPayload): Promise<InternalRequest> {
  const { data } = await apiClient.post<ApiSuccessResponse<InternalRequest>>(`/requests/${id}/complete`, payload)
  return data.data
}

export async function getRequestHistory(id: string): Promise<ApprovalEvent[]> {
  const { data } = await apiClient.get<ApiSuccessResponse<ApprovalEvent[]>>(`/requests/${id}/history`)
  return data.data
}

export async function adjustRequestItems(id: string, payload: AdjustItemsPayload): Promise<InternalRequest> {
  const { data } = await apiClient.patch<ApiSuccessResponse<InternalRequest>>(`/requests/${id}/items`, payload)
  return data.data
}

export async function cancelRequest(id: string, payload?: RequestStatusActionPayload): Promise<InternalRequest> {
  const { data } = await apiClient.post<ApiSuccessResponse<InternalRequest>>(`/requests/${id}/cancel`, payload)
  return data.data
}
