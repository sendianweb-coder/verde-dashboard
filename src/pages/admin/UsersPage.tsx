import type { ColumnDef } from '@tanstack/react-table'
import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'

import { PageHeader } from '@/components/layout/PageHeader'
import { DataTable } from '@/components/shared/DataTable'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { Button } from '@/components/ui/button'
import { useDeactivateUser, useUsers } from '@/hooks/useUsers'
import type { User } from '@/types/user'

export function AdminUsersPage() {
  const navigate = useNavigate()
  const usersQuery = useUsers()
  const deactivateUserMutation = useDeactivateUser()

  const columns = useMemo<Array<ColumnDef<User>>>(
    () => [
      {
        accessorKey: 'name',
        header: 'Name',
        cell: ({ row }) => <span className="font-medium text-text-primary">{row.original.name}</span>,
      },
      { accessorKey: 'email', header: 'Email' },
      { accessorKey: 'role', header: 'Role' },
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
            <Button type="button" variant="secondary" size="sm" onClick={() => navigate(`/admin/users/${row.original.id}`)}>
              View
            </Button>
            <ConfirmDialog
              title="Deactivate user"
              description="Are you sure you want to deactivate this user account?"
              confirmLabel="Deactivate"
              variant="destructive"
              isLoading={deactivateUserMutation.isPending}
              onConfirm={async () => {
                await deactivateUserMutation.mutateAsync(row.original.id)
                toast.success('User deactivated')
              }}
              trigger={
                <Button type="button" variant="destructive" size="sm" disabled={!row.original.isActive}>
                  Deactivate
                </Button>
              }
            />
          </div>
        ),
      },
    ],
    [deactivateUserMutation, navigate],
  )

  return (
    <section className="space-y-6">
      <PageHeader title="User Management" subtitle="Manage staff access and account status" />
      <DataTable
        data={usersQuery.data ?? []}
        columns={columns}
        isLoading={usersQuery.isLoading}
        emptyTitle="No users found"
        emptyDescription="Users created by admin will appear here."
      />
    </section>
  )
}
