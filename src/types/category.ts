export interface Category {
  id: string
  name: string
  description: string | null
  isActive: boolean
  createdAt: string
}

export interface CreateCategoryPayload {
  name: string
  description?: string
  isActive?: boolean
}

export interface UpdateCategoryPayload {
  name?: string
  description?: string
  isActive?: boolean
}
