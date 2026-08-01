import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import {
  adjustRequestItems,
  approveRequest,
  cancelRequest,
  completeRequest,
  createRequest,
  getMyRequests,
  getRequestById,
  getRequests,
  pickupRequest,
  rejectRequest,
  returnRequest,
  updateRequest,
  type GetRequestsParams,
} from '@/api/requests.api'
import type {
  AdjustItemsPayload,
  ApproveRequestPayload,
  CreateRequestPayload,
  PickupRequestPayload,
  RequestStatusActionPayload,
  ReturnRequestPayload,
  UpdateRequestPayload,
} from '@/types/request'
import { productsQueryKeys } from './useProducts'

const REQUESTS_LIST_STALE_TIME = 60_000
const REQUESTS_DETAIL_STALE_TIME = 30_000
const ADMIN_REQUEST_QUEUE_QUERY_KEY = ['admin', 'requests', 'queue'] as const

type MyRequestsParams = Pick<GetRequestsParams, 'status' | 'page' | 'limit'>

export const requestsQueryKeys = {
  all: ['requests'] as const,
  list: (params?: GetRequestsParams) => ['requests', 'list', params] as const,
  mine: (params?: MyRequestsParams) => ['requests', 'mine', params] as const,
  detail: (id: string) => ['requests', 'detail', id] as const,
}

export function useRequests(params?: GetRequestsParams) {
  return useQuery({
    queryKey: requestsQueryKeys.list(params),
    queryFn: () => getRequests(params),
    staleTime: REQUESTS_LIST_STALE_TIME,
  })
}

export function useMyRequests(params?: MyRequestsParams) {
  return useQuery({
    queryKey: requestsQueryKeys.mine(params),
    queryFn: () => getMyRequests(params),
    staleTime: REQUESTS_LIST_STALE_TIME,
  })
}

export function useRequest(id: string) {
  return useQuery({
    queryKey: requestsQueryKeys.detail(id),
    queryFn: () => getRequestById(id),
    enabled: Boolean(id),
    staleTime: REQUESTS_DETAIL_STALE_TIME,
  })
}

export function useCreateRequest() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: CreateRequestPayload) => createRequest(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: requestsQueryKeys.all })
      void queryClient.invalidateQueries({ queryKey: ADMIN_REQUEST_QUEUE_QUERY_KEY })
      void queryClient.invalidateQueries({ queryKey: productsQueryKeys.all })
    },
  })
}

interface UpdateRequestMutationPayload {
  id: string
  payload: UpdateRequestPayload
}

export function useUpdateRequest() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, payload }: UpdateRequestMutationPayload) => updateRequest(id, payload),
    onSuccess: (_updatedRequest, variables) => {
      void queryClient.invalidateQueries({ queryKey: requestsQueryKeys.all })
      void queryClient.invalidateQueries({ queryKey: requestsQueryKeys.detail(variables.id) })
      void queryClient.invalidateQueries({ queryKey: ADMIN_REQUEST_QUEUE_QUERY_KEY })
    },
  })
}

type RequestActionMutationPayload =
  | { id: string; payload: ApproveRequestPayload }
  | { id: string; payload: PickupRequestPayload }
  | { id: string; payload: RequestStatusActionPayload }
  | { id: string; payload: ReturnRequestPayload }

function useRequestActionMutation(
  mutationFn: ({ id, payload }: RequestActionMutationPayload) => Promise<unknown>,
) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn,
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({ queryKey: requestsQueryKeys.all })
      void queryClient.invalidateQueries({ queryKey: requestsQueryKeys.detail(variables.id) })
      void queryClient.invalidateQueries({ queryKey: ADMIN_REQUEST_QUEUE_QUERY_KEY })
      void queryClient.invalidateQueries({ queryKey: productsQueryKeys.all })
    },
  })
}

export function useApproveRequest() {
  return useRequestActionMutation(({ id, payload }) => approveRequest(id, payload as ApproveRequestPayload))
}

export function useRejectRequest() {
  return useRequestActionMutation(({ id, payload }) => rejectRequest(id, payload as RequestStatusActionPayload))
}

export function usePickupRequest() {
  return useRequestActionMutation(({ id, payload }) => pickupRequest(id, payload as PickupRequestPayload))
}

export function useCompleteRequest() {
  return useRequestActionMutation(({ id, payload }) => completeRequest(id, payload as RequestStatusActionPayload))
}

export function useReturnRequest() {
  return useRequestActionMutation(({ id, payload }) => returnRequest(id, payload as ReturnRequestPayload))
}

interface CancelRequestMutationPayload {
  id: string
  payload?: RequestStatusActionPayload
}

export function useCancelRequest() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, payload }: CancelRequestMutationPayload) => cancelRequest(id, payload),
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({ queryKey: requestsQueryKeys.all })
      void queryClient.invalidateQueries({ queryKey: requestsQueryKeys.detail(variables.id) })
      void queryClient.invalidateQueries({ queryKey: ADMIN_REQUEST_QUEUE_QUERY_KEY })
    },
  })
}

interface AdjustRequestItemsMutationPayload {
  id: string
  payload: AdjustItemsPayload
}

export function useAdjustRequestItems() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, payload }: AdjustRequestItemsMutationPayload) => adjustRequestItems(id, payload),
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({ queryKey: requestsQueryKeys.all })
      void queryClient.invalidateQueries({ queryKey: requestsQueryKeys.detail(variables.id) })
      void queryClient.invalidateQueries({ queryKey: ADMIN_REQUEST_QUEUE_QUERY_KEY })
      void queryClient.invalidateQueries({ queryKey: productsQueryKeys.all })
    },
  })
}
