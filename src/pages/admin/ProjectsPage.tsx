import type { ColumnDef } from '@tanstack/react-table'
import { useMemo } from 'react'
import { toast } from 'sonner'

import { PageHeader } from '@/components/layout/PageHeader'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { DataTable } from '@/components/shared/DataTable'
import { Button } from '@/components/ui/button'
import { useDeactivateProject, useProjects } from '@/hooks/useProjects'
import type { Project } from '@/types/project'

export function AdminProjectsPage() {
  const projectsQuery = useProjects()
  const deactivateProjectMutation = useDeactivateProject()

  const columns = useMemo<Array<ColumnDef<Project>>>(
    () => [
      {
        accessorKey: 'name',
        header: 'Name',
        cell: ({ row }) => <span className="font-medium text-text-primary">{row.original.name}</span>,
      },
      { accessorKey: 'description', header: 'Description' },
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
          <ConfirmDialog
            title="Deactivate project"
            description="Are you sure you want to deactivate this project?"
            confirmLabel="Deactivate"
            variant="destructive"
            isLoading={deactivateProjectMutation.isPending}
            onConfirm={async () => {
              await deactivateProjectMutation.mutateAsync(row.original.id)
              toast.success('Project deactivated')
            }}
            trigger={
              <Button type="button" size="sm" variant="destructive" disabled={!row.original.isActive}>
                Deactivate
              </Button>
            }
          />
        ),
      },
    ],
    [deactivateProjectMutation],
  )

  return (
    <section className="space-y-6">
      <PageHeader title="Project Management" subtitle="Track and maintain active project records" />
      <DataTable
        data={projectsQuery.data ?? []}
        columns={columns}
        isLoading={projectsQuery.isLoading}
        emptyTitle="No projects found"
        emptyDescription="Projects will appear here once created."
      />
    </section>
  )
}
