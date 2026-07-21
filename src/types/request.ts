export type RequestStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'PICKED_UP' | 'COMPLETED' | 'CANCELED'

export type InternalRequestItemStatus =
  | 'PENDING'
  | 'APPROVED'
  | 'REJECTED'
  | 'FULFILLED'
  | 'PARTIALLY_FULFILLED'

export type RequestItemIssueReason =
  | 'OUT_OF_STOCK'
  | 'DAMAGED'
  | 'MISSING'
  | 'OTHER'

export interface InternalRequestProduct {
  id: string
  sku: string
  name: string
  imageUrl: string | null
  unitOfMeasure: string | null
  height?: string | null
  potSize?: string | null
  lengthCm?: number | null
  widthCm?: number | null
  heightCm?: number | null
  totalQuantity: number
  reservedQuantity: number
  availableQuantity: number
  stockStatus: 'instock' | 'outofstock'
  lowStockAmount: number | null
  category: {
    id: string
    name: string
  } | null
}

export interface InternalRequestItem {
  id: string
  quantity: number
  /** @deprecated Use requestedQuantity field */
  requestedQuantity?: number
  approvedQuantity?: number | null
  fulfilledQuantity?: number
  itemStatus?: InternalRequestItemStatus
  issueReason?: RequestItemIssueReason | null
  issueComment?: string | null
  stockAtRequest: {
    totalQuantity: number
    reservedQuantity: number
    availableQuantity: number
    availableAfterRequest: number
  }
  currentStock: {
    totalQuantity: number
    reservedQuantity: number
    availableQuantity: number
  }
  product: InternalRequestProduct
}

export interface InternalRequestSummary {
  itemCount: number
  totalRequestedQuantity: number
  totalApprovedQuantity?: number
  totalFulfilledQuantity?: number
  hasItemIssues?: boolean
  hasInsufficientStock: boolean
}

export interface InternalRequest {
  id: string
  status: RequestStatus
  notes: string | null
  createdAt: string
  items: InternalRequestItem[]
  requester: {
    id: string
    name: string
  }
  project: {
    id: string
    name: string
    description: string | null
    client: string | null
    location: string | null
    projectType: string | null
  }
  summary?: InternalRequestSummary
  history?: ApprovalEvent[]
}

export interface ApprovalEvent {
  id?: string
  requestId?: string
  actorId?: string
  action: RequestStatus
  comment: string | null
  createdAt: string
  actor?: {
    name: string
    role: string
  }
}

// --- Item-level action payloads ---

export interface ItemApprovalPayload {
  itemId: string
  approvedQuantity: number
  status?: 'APPROVED' | 'REJECTED'
  reason?: RequestItemIssueReason
  comment?: string
}

export interface ApproveRequestPayload {
  comment?: string
  items?: ItemApprovalPayload[]
}

export interface AdjustItemsPayload {
  comment?: string
  items: ItemApprovalPayload[]
}

export interface PickupRequestPayload {
  comment?: string
}

// --- Legacy payload types ---

export interface CreateRequestItemPayload {
  productId: string
  quantity: number
}

export interface CreateRequestPayload {
  projectId: string
  notes?: string
  items: CreateRequestItemPayload[]
}

export interface UpdateRequestPayload {
  notes?: string
  items?: CreateRequestItemPayload[]
}

/** @deprecated Use ApproveRequestPayload, PickupRequestPayload, or AdjustItemsPayload for item-level actions */
export interface RequestStatusActionPayload {
  comment?: string
}
