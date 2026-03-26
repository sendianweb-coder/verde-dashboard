export interface Project {
  id: string
  name: string
  description: string | null
  isActive: boolean
  createdAt: string
}

export interface ProjectProductSummary {
  productId: string
  productName: string
  sku: string
  requestedQuantity: number
  currentStockQuantity: number
  currentReservedQuantity: number
  currentAvailableQuantity: number
}

export interface ProjectStockDetails {
  totalRequestCount: number
  totalUniqueProducts: number
  totalRequestedQuantity: number
  products: ProjectProductSummary[]
}

export interface ProjectWithStockDetails {
  project: Project
  stockDetails: ProjectStockDetails
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
