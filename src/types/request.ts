import type { Project } from '@/types/project'

export type RequestStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'PICKED_UP' | 'COMPLETED'

export interface InternalRequestItem {
  id: string
  requestId: string
  productId: string
  quantity: number
}

export interface InternalRequest {
  id: string
  requesterId: string
  projectId: string
  status: RequestStatus
  notes: string | null
  createdAt: string
  updatedAt: string
  items: InternalRequestItem[]
  requester?: {
    name: string
    email: string
  }
  project: Project
}

export interface ApprovalEvent {
  id: string
  requestId: string
  actorId: string
  action: RequestStatus
  comment: string | null
  createdAt: string
  actor?: {
    name: string
    role: string
  }
}

export interface CreateRequestItemPayload {
  productId: string
  quantity: number
}

export interface CreateRequestPayload {
  projectId: string
  notes?: string
  items: CreateRequestItemPayload[]
}

export interface RequestStatusActionPayload {
  comment?: string
}
