import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { createCategory, deactivateCategory, getCategories, updateCategory } from '@/api/categories.api'
import type { CreateCategoryPayload, UpdateCategoryPayload } from '@/types/category'

const CATEGORIES_LIST_STALE_TIME = 60_000

export const categoriesQueryKeys = {
  all: ['categories'] as const,
  list: () => ['categories', 'list'] as const,
}

export function useCategories() {
  return useQuery({
    queryKey: categoriesQueryKeys.list(),
    queryFn: getCategories,
    staleTime: CATEGORIES_LIST_STALE_TIME,
  })
}

export function useCreateCategory() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: CreateCategoryPayload) => createCategory(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: categoriesQueryKeys.all })
    },
  })
}

interface UpdateCategoryMutationPayload {
  id: string
  payload: UpdateCategoryPayload
}

export function useUpdateCategory() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, payload }: UpdateCategoryMutationPayload) => updateCategory(id, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: categoriesQueryKeys.all })
    },
  })
}

export function useDeactivateCategory() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => deactivateCategory(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: categoriesQueryKeys.all })
    },
  })
}
