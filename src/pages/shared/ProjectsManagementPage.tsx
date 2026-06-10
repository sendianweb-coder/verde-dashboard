import type { ColumnDef } from '@tanstack/react-table'
import type { FormEvent } from 'react'
import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { Eye, Filter, MoreHorizontal, Pencil, Power, Shapes } from 'lucide-react'

import { PageHeader } from '@/components/layout/PageHeader'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { DataTable } from '@/components/shared/DataTable'
import { DialogFormActions } from '@/components/shared/DialogFormActions'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { useCreateProject, useDeactivateProject, useProjects, useUpdateProject } from '@/hooks/useProjects'
import { getErrorMessage } from '@/lib/errors'
import { cn } from '@/lib/utils'
import type { Project } from '@/types/project'

type ProjectStatusFilter = 'all' | 'active' | 'inactive'
type ProjectDateFilter = 'all' | 'today' | 'last7days' | 'last30days'

const projectStatusFilterLabels: Record<ProjectStatusFilter, string> = {
  all: 'All Status',
  active: 'Active',
  inactive: 'Inactive',
}

const projectDateFilterLabels: Record<ProjectDateFilter, string> = {
  all: 'Created Date',
  today: 'Today',
  last7days: 'Last 7 days',
  last30days: 'Last 30 days',
}

const projectDateFormatter = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
})

interface ProjectsManagementPageProps {
  projectDetailBasePath: string
}

function formatProjectDate(value: string) {
  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return 'Unknown'
  }

  return projectDateFormatter.format(date)
}

function isWithinProjectDateFilter(value: string, filter: ProjectDateFilter) {
  if (filter === 'all') {
    return true
  }

  const timestamp = new Date(value).getTime()
  if (Number.isNaN(timestamp)) {
    return false
  }

  const day = 24 * 60 * 60 * 1000
  const now = Date.now()
  const startOfToday = new Date().setHours(0, 0, 0, 0)
  const startOfTomorrow = startOfToday + day

  if (filter === 'today') {
    return timestamp >= startOfToday && timestamp < startOfTomorrow
  }

  if (filter === 'last7days') {
    return timestamp >= now - 7 * day && timestamp <= now
  }

  return timestamp >= now - 30 * day && timestamp <= now
}

function ProjectStatusBadge({ isActive }: { isActive: boolean }) {
  return isActive ? (
    <span className="inline-flex items-center gap-1 rounded-md border border-brand-100 bg-brand-50 px-2 py-0.5 text-xs font-medium text-brand-700">
      <span className="size-1.5 rounded-full bg-brand-600" />
      Active
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 rounded-md border border-border bg-surface px-2 py-0.5 text-xs font-medium text-text-secondary">
      <span className="size-1.5 rounded-full bg-text-muted" />
      Inactive
    </span>
  )
}

export function ProjectsManagementPage({ projectDetailBasePath }: ProjectsManagementPageProps) {
  const navigate = useNavigate()
  const [isCreateProjectOpen, setIsCreateProjectOpen] = useState(false)
  const [newProjectName, setNewProjectName] = useState('')
  const [newProjectDescription, setNewProjectDescription] = useState('')
  const [editingProject, setEditingProject] = useState<Project | null>(null)
  const [projectPendingDeactivation, setProjectPendingDeactivation] = useState<Project | null>(null)
  const [updatedProjectName, setUpdatedProjectName] = useState('')
  const [updatedProjectDescription, setUpdatedProjectDescription] = useState('')
  const [statusFilter, setStatusFilter] = useState<ProjectStatusFilter>('all')
  const [dateFilter, setDateFilter] = useState<ProjectDateFilter>('all')

  const projectsQuery = useProjects()
  const createProjectMutation = useCreateProject()
  const updateProjectMutation = useUpdateProject()
  const deactivateProjectMutation = useDeactivateProject()

  const filteredProjects = useMemo(() => {
    return (projectsQuery.data ?? [])
      .filter((project) => {
        if (statusFilter === 'all') {
          return true
        }

        return statusFilter === 'active' ? project.isActive : !project.isActive
      })
      .filter((project) => isWithinProjectDateFilter(project.createdAt, dateFilter))
  }, [dateFilter, projectsQuery.data, statusFilter])

  const hasActiveFilters = statusFilter !== 'all' || dateFilter !== 'all'

  const clearFilters = () => {
    setStatusFilter('all')
    setDateFilter('all')
  }

  const columns = useMemo<Array<ColumnDef<Project>>>(
    () => [
      {
        accessorKey: 'name',
        header: 'Project',
        cell: ({ row }) => (
          <div className="flex items-center gap-2.5">
            <div className="flex size-9 items-center justify-center rounded-lg border border-border bg-surface text-text-muted">
              <Shapes className="size-4" />
            </div>
            <div className="min-w-0">
              <p className="truncate font-medium text-text-primary">{row.original.name}</p>
              <p className="text-xs text-text-muted">Project record</p>
            </div>
          </div>
        ),
      },
      {
        accessorKey: 'description',
        header: 'Description',
        cell: ({ row }) => (
          <span className={cn('text-sm', row.original.description ? 'text-text-secondary' : 'text-text-muted')}>
            {row.original.description || 'No description'}
          </span>
        ),
      },
      {
        accessorKey: 'isActive',
        header: 'Status',
        cell: ({ row }) => <ProjectStatusBadge isActive={row.original.isActive} />,
      },
      {
        accessorKey: 'createdAt',
        header: 'Created Date',
        cell: ({ row }) => <span className="text-sm tabular-nums text-text-secondary">{formatProjectDate(row.original.createdAt)}</span>,
      },
      {
        id: 'actions',
        cell: ({ row }) => (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button type="button" variant="ghost" size="icon" className="size-8" aria-label="Open project actions">
                <MoreHorizontal className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuItem onSelect={() => navigate(`${projectDetailBasePath}/${row.original.id}`)}>
                <Eye className="size-4" />
                View project
              </DropdownMenuItem>
              <DropdownMenuItem
                onSelect={() => {
                  setEditingProject(row.original)
                  setUpdatedProjectName(row.original.name)
                  setUpdatedProjectDescription(row.original.description ?? '')
                }}
              >
                <Pencil className="size-4" />
                Edit project
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                disabled={!row.original.isActive}
                className="text-error focus:text-error"
                onSelect={() => setProjectPendingDeactivation(row.original)}
              >
                <Power className="size-4" />
                Deactivate
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ),
      },
    ],
    [navigate, projectDetailBasePath],
  )

  const handleCreateProject = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const trimmedName = newProjectName.trim()
    if (!trimmedName) {
      toast.error('Project name is required.')
      return
    }

    try {
      await createProjectMutation.mutateAsync({
        name: trimmedName,
        description: newProjectDescription.trim() || undefined,
      })
      setNewProjectName('')
      setNewProjectDescription('')
      setIsCreateProjectOpen(false)
      toast.success('Project created')
    } catch (error) {
      toast.error(getErrorMessage(error, { context: 'create' }))
    }
  }

  const handleUpdateProject = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!editingProject) {
      return
    }

    const trimmedName = updatedProjectName.trim()
    if (!trimmedName) {
      toast.error('Project name is required.')
      return
    }

    try {
      await updateProjectMutation.mutateAsync({
        id: editingProject.id,
        payload: {
          name: trimmedName,
          description: updatedProjectDescription.trim() || undefined,
        },
      })
      setEditingProject(null)
      setUpdatedProjectName('')
      setUpdatedProjectDescription('')
      toast.success('Project updated')
    } catch (error) {
      toast.error(getErrorMessage(error, { context: 'update' }))
    }
  }

  return (
    <section className="space-y-6">
      <PageHeader
        title="Project Management"
        subtitle="Track and maintain active project records"
        action={
          <Button type="button" onClick={() => setIsCreateProjectOpen(true)}>
            Create project
          </Button>
        }
      />

      <DataTable
        data={filteredProjects}
        columns={columns}
        title="Projects"
        description="Browse project records, lifecycle state, and creation history."
        resultsLabel="projects"
        searchPlaceholder="Search projects..."
        getRowId={(project) => project.id}
        filters={
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button type="button" variant="secondary" size="sm" className="relative h-9">
                <Filter className="size-4" />
                Filter
                {hasActiveFilters ? <span className="absolute -right-1 -top-1 size-2 rounded-full bg-brand-600" /> : null}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52">
              <DropdownMenuLabel>Status</DropdownMenuLabel>
              {(Object.keys(projectStatusFilterLabels) as ProjectStatusFilter[]).map((filter) => (
                <DropdownMenuCheckboxItem
                  key={filter}
                  checked={statusFilter === filter}
                  onCheckedChange={() => setStatusFilter(filter)}
                >
                  {projectStatusFilterLabels[filter]}
                </DropdownMenuCheckboxItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuLabel>Created</DropdownMenuLabel>
              {(Object.keys(projectDateFilterLabels) as ProjectDateFilter[]).map((filter) => (
                <DropdownMenuCheckboxItem
                  key={filter}
                  checked={dateFilter === filter}
                  onCheckedChange={() => setDateFilter(filter)}
                >
                  {projectDateFilterLabels[filter]}
                </DropdownMenuCheckboxItem>
              ))}
              {hasActiveFilters ? (
                <>
                  <DropdownMenuSeparator />
                  <Button type="button" variant="ghost" size="sm" className="w-full justify-start" onClick={clearFilters}>
                    Clear filters
                  </Button>
                </>
              ) : null}
            </DropdownMenuContent>
          </DropdownMenu>
        }
        isLoading={projectsQuery.isLoading}
        hasError={projectsQuery.isError}
        errorTitle="Unable to load projects"
        errorDescription={getErrorMessage(projectsQuery.error, { context: 'load' })}
        emptyTitle="No projects found"
        emptyDescription="Projects will appear here once created."
      />

      <Dialog
        open={isCreateProjectOpen}
        onOpenChange={(open) => {
          setIsCreateProjectOpen(open)
          if (!open) {
            setNewProjectName('')
            setNewProjectDescription('')
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Project</DialogTitle>
            <DialogDescription>Add a new project to use across requests.</DialogDescription>
          </DialogHeader>

          <form className="space-y-4" onSubmit={handleCreateProject}>
            <div>
              <label htmlFor="new-project-name" className="mb-1.5 block text-sm font-medium text-text-primary">
                Project name
              </label>
              <Input
                id="new-project-name"
                value={newProjectName}
                onChange={(event) => setNewProjectName(event.target.value)}
                placeholder="Enter project name"
                disabled={createProjectMutation.isPending}
              />
            </div>

            <div>
              <label htmlFor="new-project-description" className="mb-1.5 block text-sm font-medium text-text-primary">
                Description (optional)
              </label>
              <Input
                id="new-project-description"
                value={newProjectDescription}
                onChange={(event) => setNewProjectDescription(event.target.value)}
                placeholder="Add project details"
                disabled={createProjectMutation.isPending}
              />
            </div>

            <DialogFormActions
              isSubmitting={createProjectMutation.isPending}
              submitLabel="Create Project"
              submittingLabel="Creating..."
              onCancel={() => setIsCreateProjectOpen(false)}
            />
          </form>
        </DialogContent>
      </Dialog>

      <Dialog
        open={Boolean(editingProject)}
        onOpenChange={(open) => {
          if (!open) {
            setEditingProject(null)
            setUpdatedProjectName('')
            setUpdatedProjectDescription('')
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Project</DialogTitle>
            <DialogDescription>Update project details for future requests.</DialogDescription>
          </DialogHeader>

          <form className="space-y-4" onSubmit={handleUpdateProject}>
            <div>
              <label htmlFor="update-project-name" className="mb-1.5 block text-sm font-medium text-text-primary">
                Project name
              </label>
              <Input
                id="update-project-name"
                value={updatedProjectName}
                onChange={(event) => setUpdatedProjectName(event.target.value)}
                placeholder="Enter project name"
                disabled={updateProjectMutation.isPending}
              />
            </div>

            <div>
              <label
                htmlFor="update-project-description"
                className="mb-1.5 block text-sm font-medium text-text-primary"
              >
                Description (optional)
              </label>
              <Input
                id="update-project-description"
                value={updatedProjectDescription}
                onChange={(event) => setUpdatedProjectDescription(event.target.value)}
                placeholder="Add project details"
                disabled={updateProjectMutation.isPending}
              />
            </div>

            <DialogFormActions
              isSubmitting={updateProjectMutation.isPending}
              submitLabel="Save Changes"
              submittingLabel="Saving..."
              onCancel={() => setEditingProject(null)}
            />
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={Boolean(projectPendingDeactivation)}
        onOpenChange={(open) => {
          if (!open) {
            setProjectPendingDeactivation(null)
          }
        }}
        title="Deactivate project"
        description={`Are you sure you want to deactivate ${projectPendingDeactivation?.name ?? 'this project'}?`}
        confirmLabel="Deactivate"
        variant="destructive"
        isLoading={deactivateProjectMutation.isPending}
        onConfirm={async () => {
          if (!projectPendingDeactivation) {
            return
          }

          try {
            await deactivateProjectMutation.mutateAsync(projectPendingDeactivation.id)
            toast.success('Project deactivated')
          } catch (error) {
            toast.error(getErrorMessage(error, { context: 'update' }))
            throw error
          }
        }}
      />
    </section>
  )
}
