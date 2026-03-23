import { apiClient } from '@/api/client'
import type { ApiSuccessResponse } from '@/types/common'
import type { CreateUserPayload, UpdateUserPayload, User, UserActivityProfile } from '@/types/user'

export interface GetUsersParams {
  role?: User['role']
  isActive?: boolean
  search?: string
  page?: number
  limit?: number
}

export async function getUsers(params?: GetUsersParams): Promise<User[]> {
  const { data } = await apiClient.get<ApiSuccessResponse<User[]>>('/users', { params })
  return data.data
}

export async function getUserById(id: string, params?: { page?: number; limit?: number }): Promise<UserActivityProfile> {
  const { data } = await apiClient.get<ApiSuccessResponse<UserActivityProfile>>(`/users/${id}`, {
    params,
  })
  return data.data
}

export async function createUser(payload: CreateUserPayload): Promise<User> {
  const { data } = await apiClient.post<ApiSuccessResponse<User>>('/users', payload)
  return data.data
}

export async function updateUser(id: string, payload: UpdateUserPayload): Promise<User> {
  const { data } = await apiClient.patch<ApiSuccessResponse<User>>(`/users/${id}`, payload)
  return data.data
}

export async function deleteUser(id: string): Promise<void> {
  await apiClient.delete(`/users/${id}`)
}

export async function deactivateUser(id: string): Promise<User> {
  const { data } = await apiClient.patch<ApiSuccessResponse<User>>(`/users/${id}/deactivate`)
  return data.data
}
