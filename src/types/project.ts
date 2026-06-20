import type { UserRole } from '@/types/auth'
import type { RequestStatus } from '@/types/request'

export type ProjectUserRole = UserRole | 'CUSTOMER'

export interface ProjectUserSummary {
  id: string
  name: string
  email: string
  role: ProjectUserRole
}

export interface ProjectAssignment {
  id: string
  projectId: string
  userId: string
  assignedAt: string
  user: ProjectUserSummary
}

export interface Project {
  id: string
  name: string
  description: string | null
  client: string | null
  location: string | null
  projectType: string | null
  createdBy: ProjectUserSummary | null
  assignments: ProjectAssignment[]
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface ProjectProductRequesterBreakdown {
  requesterId: string
  requesterName: string
  requestCount: number
  requestedQuantity: number
}

export interface ProjectProductSummary {
  productId: string
  productName: string
  sku: string
  requestedQuantity: number
  currentStockQuantity: number
  currentReservedQuantity: number
  currentAvailableQuantity: number
  currentRequestStatus: RequestStatus | null
  currentRequesterName: string | null
  isDuplicated: boolean
  requesterBreakdown: ProjectProductRequesterBreakdown[]
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
  client?: string
  location?: string
  projectType?: string
  assignedUserIds?: string[]
}

export interface UpdateProjectPayload {
  name?: string
  description?: string
  client?: string
  location?: string
  projectType?: string
  isActive?: boolean
  assignedUserIds?: string[]
}
