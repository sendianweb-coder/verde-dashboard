import { apiClient } from '@/api/client'
import type { ApiSuccessResponse } from '@/types/common'
import type { CreateProjectPayload, Project, UpdateProjectPayload } from '@/types/project'

export async function getProjects(): Promise<Project[]> {
  const { data } = await apiClient.get<ApiSuccessResponse<Project[]>>('/projects')
  return data.data
}

export async function createProject(payload: CreateProjectPayload): Promise<Project> {
  const { data } = await apiClient.post<ApiSuccessResponse<Project>>('/projects', payload)
  return data.data
}

export async function updateProject(id: string, payload: UpdateProjectPayload): Promise<Project> {
  const { data } = await apiClient.patch<ApiSuccessResponse<Project>>(`/projects/${id}`, payload)
  return data.data
}
