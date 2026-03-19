import { apiClient } from '@/api/client'
import type { ApiSuccessResponse } from '@/types/common'
import type {
  ApprovalEvent,
  CreateRequestPayload,
  InternalRequest,
  RequestStatusActionPayload,
} from '@/types/request'

export async function getRequests(): Promise<InternalRequest[]> {
  const { data } = await apiClient.get<ApiSuccessResponse<InternalRequest[]>>('/requests')
  return data.data
}

export async function getMyRequests(): Promise<InternalRequest[]> {
  const { data } = await apiClient.get<ApiSuccessResponse<InternalRequest[]>>('/requests/mine')
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

export async function approveRequest(id: string, payload: RequestStatusActionPayload): Promise<InternalRequest> {
  const { data } = await apiClient.post<ApiSuccessResponse<InternalRequest>>(`/requests/${id}/approve`, payload)
  return data.data
}

export async function rejectRequest(id: string, payload: RequestStatusActionPayload): Promise<InternalRequest> {
  const { data } = await apiClient.post<ApiSuccessResponse<InternalRequest>>(`/requests/${id}/reject`, payload)
  return data.data
}

export async function pickupRequest(id: string, payload: RequestStatusActionPayload): Promise<InternalRequest> {
  const { data } = await apiClient.post<ApiSuccessResponse<InternalRequest>>(`/requests/${id}/pickup`, payload)
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
