export interface ApiSuccessResponse<T> {
  success: boolean
  data: T
}

export interface ApiSuccessWithMessage<T> extends ApiSuccessResponse<T> {
  message?: string
}

export interface PaginationMeta {
  total: number
  page: number
  limit: number
  totalPages: number
}

export interface OffsetPaginationMeta {
  total: number
  limit: number
  offset: number
}

export interface PaginatedResponse<T> {
  success: boolean
  data: T[]
  pagination: PaginationMeta
}

export interface OffsetPaginatedResponse<T> {
  success: boolean
  data: T[]
  pagination: OffsetPaginationMeta
}
