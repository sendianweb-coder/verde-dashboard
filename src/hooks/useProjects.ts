import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { createProject, deactivateProject, getProjects, updateProject } from '@/api/projects.api'
import type { CreateProjectPayload, UpdateProjectPayload } from '@/types/project'

const PROJECTS_LIST_STALE_TIME = 60_000

export const projectsQueryKeys = {
  all: ['projects'] as const,
  list: () => ['projects', 'list'] as const,
}

export function useProjects() {
  return useQuery({
    queryKey: projectsQueryKeys.list(),
    queryFn: getProjects,
    staleTime: PROJECTS_LIST_STALE_TIME,
  })
}

export function useCreateProject() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: CreateProjectPayload) => createProject(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: projectsQueryKeys.all })
    },
  })
}

interface UpdateProjectMutationPayload {
  id: string
  payload: UpdateProjectPayload
}

export function useUpdateProject() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, payload }: UpdateProjectMutationPayload) => updateProject(id, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: projectsQueryKeys.all })
    },
  })
}

export function useDeactivateProject() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => deactivateProject(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: projectsQueryKeys.all })
    },
  })
}
