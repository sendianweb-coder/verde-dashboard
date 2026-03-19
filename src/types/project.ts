export interface Project {
  id: string
  name: string
  description: string | null
  isActive: boolean
  createdAt: string
}

export interface CreateProjectPayload {
  name: string
  description?: string
}

export interface UpdateProjectPayload {
  name?: string
  description?: string
  isActive?: boolean
}
