import type { ColumnDef } from '@tanstack/react-table'
import type { FormEvent } from 'react'
import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { Eye, Filter, MoreHorizontal, Pencil, Power, Shapes, UsersRound } from 'lucide-react'

import { PageHeader } from '@/components/layout/PageHeader'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { DataTable } from '@/components/shared/DataTable'
import { DialogFormActions } from '@/components/shared/DialogFormActions'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
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
import { useAssignableProjectUsers } from '@/hooks/useUsers'
import { getErrorMessage } from '@/lib/errors'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/store/authStore'
import type { Project } from '@/types/project'
import type { User } from '@/types/user'

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

function optionalProjectField(value: string) {
  const trimmedValue = value.trim()
  return trimmedValue || undefined
}

function getProjectAssignmentIds(project: Project) {
  return project.assignments.map((assignment) => assignment.userId)
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

interface AssignedUsersFieldProps {
  idPrefix: string
  users: User[]
  selectedUserIds: string[]
  isLoading: boolean
  hasError: boolean
  disabled: boolean
  onToggle: (userId: string) => void
}

function AssignedUsersField({
  idPrefix,
  users,
  selectedUserIds,
  isLoading,
  hasError,
  disabled,
  onToggle,
}: AssignedUsersFieldProps) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-3">
        <label className="block text-sm font-medium text-text-primary">Assigned users</label>
        <span className="text-xs tabular-nums text-text-muted">{selectedUserIds.length} selected</span>
      </div>

      <div className="rounded-lg border border-border bg-surface p-2">
        {isLoading ? <p className="px-2 py-3 text-sm text-text-secondary">Loading assignable users...</p> : null}
        {hasError ? <p className="px-2 py-3 text-sm text-error">Unable to load assignable users.</p> : null}
        {!isLoading && !hasError && users.length === 0 ? (
          <p className="px-2 py-3 text-sm text-text-secondary">No active employees or store keepers found.</p>
        ) : null}
        {!isLoading && !hasError && users.length > 0 ? (
          <div className="max-h-44 space-y-1 overflow-y-auto">
            {users.map((user) => {
              const checkboxId = `${idPrefix}-${user.id}`

              return (
                <label
                  key={user.id}
                  htmlFor={checkboxId}
                  className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-2 text-sm hover:bg-background"
                >
                  <Checkbox
                    id={checkboxId}
                    checked={selectedUserIds.includes(user.id)}
                    disabled={disabled}
                    onCheckedChange={() => onToggle(user.id)}
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-medium text-text-primary">{user.name}</span>
                    <span className="block truncate text-xs text-text-muted">
                      {user.role.replace('_', ' ')} / {user.email}
                    </span>
                  </span>
                </label>
              )
            })}
          </div>
        ) : null}
      </div>
    </div>
  )
}

export function ProjectsManagementPage({ projectDetailBasePath }: ProjectsManagementPageProps) {
  const navigate = useNavigate()
  const currentUserRole = useAuthStore((state) => state.user?.role)
  const canManageProjectDetails = currentUserRole === 'ADMIN' || currentUserRole === 'STORE_KEEPER' || currentUserRole === 'EMPLOYEE'
  const canManageAssignments = currentUserRole === 'ADMIN'
  const [isCreateProjectOpen, setIsCreateProjectOpen] = useState(false)
  const [newProjectName, setNewProjectName] = useState('')
  const [newProjectDescription, setNewProjectDescription] = useState('')
  const [newProjectClient, setNewProjectClient] = useState('')
  const [newProjectLocation, setNewProjectLocation] = useState('')
  const [newProjectType, setNewProjectType] = useState('')
  const [newProjectAssignedUserIds, setNewProjectAssignedUserIds] = useState<string[]>([])
  const [editingProject, setEditingProject] = useState<Project | null>(null)
  const [projectPendingDeactivation, setProjectPendingDeactivation] = useState<Project | null>(null)
  const [updatedProjectName, setUpdatedProjectName] = useState('')
  const [updatedProjectDescription, setUpdatedProjectDescription] = useState('')
  const [updatedProjectClient, setUpdatedProjectClient] = useState('')
  const [updatedProjectLocation, setUpdatedProjectLocation] = useState('')
  const [updatedProjectType, setUpdatedProjectType] = useState('')
  const [updatedProjectAssignedUserIds, setUpdatedProjectAssignedUserIds] = useState<string[]>([])
  const [statusFilter, setStatusFilter] = useState<ProjectStatusFilter>('all')
  const [dateFilter, setDateFilter] = useState<ProjectDateFilter>('all')

  const projectsQuery = useProjects()
  const assignableUsersQuery = useAssignableProjectUsers(canManageAssignments)
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

  const toggleAssignedUser = (userId: string, selectedUserIds: string[], setSelectedUserIds: (userIds: string[]) => void) => {
    setSelectedUserIds(
      selectedUserIds.includes(userId)
        ? selectedUserIds.filter((selectedUserId) => selectedUserId !== userId)
        : [...selectedUserIds, userId],
    )
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
              <p className="text-xs text-text-muted">
                {[row.original.client, row.original.location, row.original.projectType].filter(Boolean).join(' / ') || 'Project record'}
              </p>
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
        id: 'assignments',
        header: 'Assignments',
        cell: ({ row }) => (
          <div className="flex items-center gap-2 text-sm text-text-secondary">
            <UsersRound className="size-4 text-text-muted" />
            <span className="tabular-nums">{row.original.assignments.length}</span>
          </div>
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
              {canManageProjectDetails ? (
                <>
                  <DropdownMenuItem
                    onSelect={() => {
                      setEditingProject(row.original)
                      setUpdatedProjectName(row.original.name)
                      setUpdatedProjectDescription(row.original.description ?? '')
                      setUpdatedProjectClient(row.original.client ?? '')
                      setUpdatedProjectLocation(row.original.location ?? '')
                      setUpdatedProjectType(row.original.projectType ?? '')
                      setUpdatedProjectAssignedUserIds(getProjectAssignmentIds(row.original))
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
                </>
              ) : null}
            </DropdownMenuContent>
          </DropdownMenu>
        ),
      },
    ],
    [canManageProjectDetails, navigate, projectDetailBasePath],
  )

  const handleCreateProject = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const trimmedName = newProjectName.trim()
    if (!trimmedName) {
      toast.error('Project name is required.')
      return
    }

    try {
      const payload = {
        name: trimmedName,
        description: optionalProjectField(newProjectDescription),
        client: optionalProjectField(newProjectClient),
        location: optionalProjectField(newProjectLocation),
        projectType: optionalProjectField(newProjectType),
        ...(canManageAssignments && newProjectAssignedUserIds.length > 0
          ? { assignedUserIds: newProjectAssignedUserIds }
          : {}),
      }

      await createProjectMutation.mutateAsync({
        ...payload,
      })
      setNewProjectName('')
      setNewProjectDescription('')
      setNewProjectClient('')
      setNewProjectLocation('')
      setNewProjectType('')
      setNewProjectAssignedUserIds([])
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
          description: optionalProjectField(updatedProjectDescription),
          client: optionalProjectField(updatedProjectClient),
          location: optionalProjectField(updatedProjectLocation),
          projectType: optionalProjectField(updatedProjectType),
          ...(canManageAssignments ? { assignedUserIds: updatedProjectAssignedUserIds } : {}),
        },
      })
      setEditingProject(null)
      setUpdatedProjectName('')
      setUpdatedProjectDescription('')
      setUpdatedProjectClient('')
      setUpdatedProjectLocation('')
      setUpdatedProjectType('')
      setUpdatedProjectAssignedUserIds([])
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
          canManageProjectDetails ? (
            <Button type="button" onClick={() => setIsCreateProjectOpen(true)}>
              Create project
            </Button>
          ) : null
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
            setNewProjectClient('')
            setNewProjectLocation('')
            setNewProjectType('')
            setNewProjectAssignedUserIds([])
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

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label htmlFor="new-project-client" className="mb-1.5 block text-sm font-medium text-text-primary">
                  Client (optional)
                </label>
                <Input
                  id="new-project-client"
                  value={newProjectClient}
                  onChange={(event) => setNewProjectClient(event.target.value)}
                  placeholder="Client name"
                  disabled={createProjectMutation.isPending}
                />
              </div>

              <div>
                <label htmlFor="new-project-location" className="mb-1.5 block text-sm font-medium text-text-primary">
                  Location (optional)
                </label>
                <Input
                  id="new-project-location"
                  value={newProjectLocation}
                  onChange={(event) => setNewProjectLocation(event.target.value)}
                  placeholder="Site or campus"
                  disabled={createProjectMutation.isPending}
                />
              </div>
            </div>

            <div>
              <label htmlFor="new-project-type" className="mb-1.5 block text-sm font-medium text-text-primary">
                Project type (optional)
              </label>
              <Input
                id="new-project-type"
                value={newProjectType}
                onChange={(event) => setNewProjectType(event.target.value)}
                placeholder="Garden Renovation"
                disabled={createProjectMutation.isPending}
              />
            </div>

            {canManageAssignments ? (
              <AssignedUsersField
                idPrefix="new-project-assignee"
                users={assignableUsersQuery.data ?? []}
                selectedUserIds={newProjectAssignedUserIds}
                isLoading={assignableUsersQuery.isLoading}
                hasError={assignableUsersQuery.isError}
                disabled={createProjectMutation.isPending}
                onToggle={(userId) => toggleAssignedUser(userId, newProjectAssignedUserIds, setNewProjectAssignedUserIds)}
              />
            ) : null}

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
            setUpdatedProjectClient('')
            setUpdatedProjectLocation('')
            setUpdatedProjectType('')
            setUpdatedProjectAssignedUserIds([])
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

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label htmlFor="update-project-client" className="mb-1.5 block text-sm font-medium text-text-primary">
                  Client (optional)
                </label>
                <Input
                  id="update-project-client"
                  value={updatedProjectClient}
                  onChange={(event) => setUpdatedProjectClient(event.target.value)}
                  placeholder="Client name"
                  disabled={updateProjectMutation.isPending}
                />
              </div>

              <div>
                <label htmlFor="update-project-location" className="mb-1.5 block text-sm font-medium text-text-primary">
                  Location (optional)
                </label>
                <Input
                  id="update-project-location"
                  value={updatedProjectLocation}
                  onChange={(event) => setUpdatedProjectLocation(event.target.value)}
                  placeholder="Site or campus"
                  disabled={updateProjectMutation.isPending}
                />
              </div>
            </div>

            <div>
              <label htmlFor="update-project-type" className="mb-1.5 block text-sm font-medium text-text-primary">
                Project type (optional)
              </label>
              <Input
                id="update-project-type"
                value={updatedProjectType}
                onChange={(event) => setUpdatedProjectType(event.target.value)}
                placeholder="Garden Renovation"
                disabled={updateProjectMutation.isPending}
              />
            </div>

            {canManageAssignments ? (
              <AssignedUsersField
                idPrefix="update-project-assignee"
                users={assignableUsersQuery.data ?? []}
                selectedUserIds={updatedProjectAssignedUserIds}
                isLoading={assignableUsersQuery.isLoading}
                hasError={assignableUsersQuery.isError}
                disabled={updateProjectMutation.isPending}
                onToggle={(userId) =>
                  toggleAssignedUser(userId, updatedProjectAssignedUserIds, setUpdatedProjectAssignedUserIds)
                }
              />
            ) : null}

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
