import { useMutation, useQuery } from '@tanstack/react-query'

import { createUser, getUserById, getUsers, type GetUsersParams } from '@/api/users.api'
import type { CreateUserPayload } from '@/types/user'

export function useUsers(params?: GetUsersParams) {
  return useQuery({
    queryKey: ['users', 'list', params],
    queryFn: () => getUsers(params),
  })
}

export function useUser(id: string) {
  return useQuery({
    queryKey: ['users', 'detail', id],
    queryFn: () => getUserById(id),
    enabled: Boolean(id),
    staleTime: 30_000,
  })
}

export function useCreateUser() {
  return useMutation({
    mutationFn: (payload: CreateUserPayload) => createUser(payload),
  })
}
