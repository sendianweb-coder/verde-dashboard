import { apiClient } from '@/api/client'
import type { ApiSuccessResponse, OffsetPaginatedResponse } from '@/types/common'
import type { CreateProjectPayload, Project, ProjectOption, ProjectWithStockDetails, UpdateProjectPayload } from '@/types/project'

export async function getProjects(): Promise<Project[]> {
  const { data } = await apiClient.get<ApiSuccessResponse<Project[]>>('/projects')
  return data.data
}

export interface GetProjectOptionsParams {
  search?: string
  limit?: number
  offset?: number
}

export async function getProjectOptions(
  params?: GetProjectOptionsParams,
): Promise<OffsetPaginatedResponse<ProjectOption>> {
  const { data } = await apiClient.get<OffsetPaginatedResponse<ProjectOption>>('/projects/options', { params })
  return data
}

export async function createProject(payload: CreateProjectPayload): Promise<Project> {
  const { data } = await apiClient.post<ApiSuccessResponse<Project>>('/projects', payload)
  return data.data
}

export async function getProject(id: string): Promise<ProjectWithStockDetails> {
  const { data } = await apiClient.get<ApiSuccessResponse<ProjectWithStockDetails>>(`/projects/${id}`)
  return data.data
}

export async function updateProject(id: string, payload: UpdateProjectPayload): Promise<Project> {
  const { data } = await apiClient.patch<ApiSuccessResponse<Project>>(`/projects/${id}`, payload)
  return data.data
}

export async function deactivateProject(id: string): Promise<Project> {
  const { data } = await apiClient.patch<ApiSuccessResponse<Project>>(`/projects/${id}`, { isActive: false })
  return data.data
}
