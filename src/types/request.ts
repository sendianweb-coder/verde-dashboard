export type RequestStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'PICKED_UP' | 'COMPLETED' | 'CANCELED'

export interface InternalRequestProduct {
  id: string
  sku: string
  name: string
  imageUrl: string | null
  unitOfMeasure: string | null
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

export interface RequestStatusActionPayload {
  comment?: string
}
