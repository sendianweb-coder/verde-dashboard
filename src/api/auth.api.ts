import { apiClient } from '@/api/client'
import type { AuthUser, ChangePasswordPayload, LoginPayload } from '@/types/auth'
import type { ApiSuccessResponse, ApiSuccessWithMessage } from '@/types/common'

interface LoginResponseData {
  token: string
  user: AuthUser
}

interface MeResponseData {
  user: AuthUser
}

export async function login(payload: LoginPayload): Promise<LoginResponseData> {
  const { data } = await apiClient.post<ApiSuccessResponse<LoginResponseData>>('/auth/login', payload)
  return data.data
}

export async function logout(): Promise<{ message?: string }> {
  const { data } = await apiClient.post<ApiSuccessWithMessage<Record<string, never>>>('/auth/logout')
  return { message: data.message }
}

export async function getMe(): Promise<AuthUser> {
  const { data } = await apiClient.get<ApiSuccessResponse<MeResponseData>>('/auth/me')
  return data.data.user
}

export async function changePassword(payload: ChangePasswordPayload): Promise<{ message?: string }> {
  const { data } = await apiClient.patch<ApiSuccessWithMessage<Record<string, never>>>('/auth/password', payload)
  return { message: data.message }
}
