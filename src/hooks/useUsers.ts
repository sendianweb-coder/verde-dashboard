import { useMutation, useQuery } from '@tanstack/react-query'

import { apiClient } from '@/api/client'

interface UserRecord {
  id: string
  fullName: string
  email: string
  role: 'ADMIN' | 'STORE_KEEPER' | 'EMPLOYEE'
}

export function useUsers() {
  return useQuery({
    queryKey: ['users', 'list'],
    queryFn: async () => {
      const { data } = await apiClient.get<UserRecord[]>('/users')
      return data
    },
  })
}

export function useUser(id: string) {
  return useQuery({
    queryKey: ['users', 'detail', id],
    queryFn: async () => {
      const { data } = await apiClient.get<UserRecord>(`/users/${id}`)
      return data
    },
    enabled: Boolean(id),
    staleTime: 30_000,
  })
}

export function useCreateUser() {
  return useMutation({
    mutationFn: async (payload: Partial<UserRecord>) => {
      const { data } = await apiClient.post<UserRecord>('/users', payload)
      return data
    },
  })
}
