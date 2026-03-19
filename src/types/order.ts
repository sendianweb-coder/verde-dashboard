export type OrderStatus = 'PENDING' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED'

export interface OrderItem {
  id: string
  orderId: string
  productId: string
  quantity: number
  unitPrice: string
}

export interface Order {
  id: string
  customerId: string
  status: OrderStatus
  totalAmount: string
  notes: string | null
  createdAt: string
  updatedAt: string
  items: OrderItem[]
}

export interface CreateOrderItemPayload {
  productId: string
  quantity: number
}

export interface CreateOrderPayload {
  items: CreateOrderItemPayload[]
  notes?: string
}

export interface UpdateOrderStatusPayload {
  status: OrderStatus
}
