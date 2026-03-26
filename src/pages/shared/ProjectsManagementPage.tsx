import type { ColumnDef } from '@tanstack/react-table'
import type { FormEvent } from 'react'
import { useMemo, useState } from 'react'
import { toast } from 'sonner'

import { PageHeader } from '@/components/layout/PageHeader'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { DataTable } from '@/components/shared/DataTable'
import { DialogFormActions } from '@/components/shared/DialogFormActions'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { useCreateProject, useDeactivateProject, useProjects, useUpdateProject } from '@/hooks/useProjects'
import { getErrorMessage } from '@/lib/errors'
import type { Project } from '@/types/project'

export function ProjectsManagementPage() {
  const [isCreateProjectOpen, setIsCreateProjectOpen] = useState(false)
  const [newProjectName, setNewProjectName] = useState('')
  const [newProjectDescription, setNewProjectDescription] = useState('')
  const [editingProject, setEditingProject] = useState<Project | null>(null)
  const [updatedProjectName, setUpdatedProjectName] = useState('')
  const [updatedProjectDescription, setUpdatedProjectDescription] = useState('')

  const projectsQuery = useProjects()
  const createProjectMutation = useCreateProject()
  const updateProjectMutation = useUpdateProject()
  const deactivateProjectMutation = useDeactivateProject()

  const columns = useMemo<Array<ColumnDef<Project>>>(
    () => [
      {
        accessorKey: 'name',
        header: 'Name',
        cell: ({ row }) => <span className="font-medium text-text-primary">{row.original.name}</span>,
      },
      {
        accessorKey: 'description',
        header: 'Description',
        cell: ({ row }) => <span>{row.original.description || 'No description'}</span>,
      },
      {
        accessorKey: 'isActive',
        header: 'Status',
        cell: ({ row }) => <span>{row.original.isActive ? 'Active' : 'Inactive'}</span>,
      },
      {
        accessorKey: 'createdAt',
        header: 'Created',
        cell: ({ row }) => <span>{new Date(row.original.createdAt).toLocaleDateString()}</span>,
      },
      {
        id: 'actions',
        header: 'Actions',
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <Button
              type="button"
              size="sm"
              variant="secondary"
              onClick={() => {
                setEditingProject(row.original)
                setUpdatedProjectName(row.original.name)
                setUpdatedProjectDescription(row.original.description ?? '')
              }}
            >
              Edit
            </Button>
            <ConfirmDialog
              title="Deactivate project"
              description="Are you sure you want to deactivate this project?"
              confirmLabel="Deactivate"
              variant="destructive"
              isLoading={deactivateProjectMutation.isPending}
              onConfirm={async () => {
                try {
                  await deactivateProjectMutation.mutateAsync(row.original.id)
                  toast.success('Project deactivated')
                } catch (error) {
                  toast.error(getErrorMessage(error, { context: 'update' }))
                }
              }}
              trigger={
                <Button type="button" size="sm" variant="destructive" disabled={!row.original.isActive}>
                  Deactivate
                </Button>
              }
            />
          </div>
        ),
      },
    ],
    [deactivateProjectMutation],
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
        data={projectsQuery.data ?? []}
        columns={columns}
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
    </section>
  )
}
