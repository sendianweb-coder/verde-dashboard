import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import {
  createUser,
  deactivateUser,
  deleteUser,
  getUserById,
  getUsers,
  type GetUsersParams,
  updateUser,
} from '@/api/users.api'
import type { CreateUserPayload, UpdateUserPayload } from '@/types/user'

const USERS_LIST_STALE_TIME = 60_000
const USERS_DETAIL_STALE_TIME = 30_000

export const usersQueryKeys = {
  all: ['users'] as const,
  list: (params?: GetUsersParams) => ['users', 'list', params] as const,
  detail: (id: string) => ['users', 'detail', id] as const,
}

export function useUsers(params?: GetUsersParams) {
  return useQuery({
    queryKey: usersQueryKeys.list(params),
    queryFn: () => getUsers(params),
    staleTime: USERS_LIST_STALE_TIME,
  })
}

export function useUser(id: string) {
  return useQuery({
    queryKey: usersQueryKeys.detail(id),
    queryFn: () => getUserById(id),
    enabled: Boolean(id),
    staleTime: USERS_DETAIL_STALE_TIME,
  })
}

export function useCreateUser() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: CreateUserPayload) => createUser(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: usersQueryKeys.all })
    },
  })
}

interface UpdateUserMutationPayload {
  id: string
  payload: UpdateUserPayload
}

export function useUpdateUser() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, payload }: UpdateUserMutationPayload) => updateUser(id, payload),
    onSuccess: (_updatedUser, variables) => {
      void queryClient.invalidateQueries({ queryKey: usersQueryKeys.all })
      void queryClient.invalidateQueries({ queryKey: usersQueryKeys.detail(variables.id) })
    },
  })
}

export function useDeactivateUser() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => deactivateUser(id),
    onSuccess: (_deactivatedUser, id) => {
      void queryClient.invalidateQueries({ queryKey: usersQueryKeys.all })
      void queryClient.invalidateQueries({ queryKey: usersQueryKeys.detail(id) })
    },
  })
}

export function useDeleteUser() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => deleteUser(id),
    onSuccess: (_result, id) => {
      void queryClient.invalidateQueries({ queryKey: usersQueryKeys.all })
      void queryClient.removeQueries({ queryKey: usersQueryKeys.detail(id) })
    },
  })
}
