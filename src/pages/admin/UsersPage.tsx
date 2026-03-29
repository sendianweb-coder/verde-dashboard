import type { ColumnDef } from '@tanstack/react-table'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'

import { PageHeader } from '@/components/layout/PageHeader'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { DataTable } from '@/components/shared/DataTable'
import { DialogFormActions } from '@/components/shared/DialogFormActions'
import { FormField } from '@/components/shared/FormField'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { useCreateUser, useDeleteUser, useUsers } from '@/hooks/useUsers'
import { getErrorMessage } from '@/lib/errors'
import { createUserSchema, type CreateUserFormValues } from '@/lib/validators'
import type { User } from '@/types/user'

export function AdminUsersPage() {
  const navigate = useNavigate()
  const [isCreateUserOpen, setIsCreateUserOpen] = useState(false)
  const usersQuery = useUsers()
  const createUserMutation = useCreateUser()
  const deleteUserMutation = useDeleteUser()

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateUserFormValues>({
    resolver: zodResolver(createUserSchema),
    defaultValues: {
      name: '',
      email: '',
      role: 'EMPLOYEE',
      password: '',
    },
  })

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
              title="Delete user"
              description="Are you sure you want to delete this user account? This action cannot be undone."
              confirmLabel="Delete"
              variant="destructive"
              isLoading={deleteUserMutation.isPending}
              onConfirm={async () => {
                try {
                  await deleteUserMutation.mutateAsync(row.original.id)
                  toast.success('User deleted')
                } catch (error) {
                  toast.error(getErrorMessage(error, { context: 'update' }))
                }
              }}
              trigger={
                <Button type="button" variant="destructive" size="sm">
                  Delete
                </Button>
              }
            />
          </div>
        ),
      },
    ],
    [deleteUserMutation, navigate],
  )

  const handleCreateUser = async (values: CreateUserFormValues) => {
    try {
      await createUserMutation.mutateAsync(values)
      toast.success('User created successfully')
      setIsCreateUserOpen(false)
      reset()
    } catch (error) {
      toast.error(getErrorMessage(error, { context: 'create' }))
    }
  }

  return (
    <section className="space-y-6">
      <PageHeader
        title="User Management"
        subtitle="Manage staff access and account status"
        action={
          <Button type="button" onClick={() => setIsCreateUserOpen(true)}>
            Create User
          </Button>
        }
      />
      <DataTable
        data={usersQuery.data ?? []}
        columns={columns}
        isLoading={usersQuery.isLoading}
        hasError={usersQuery.isError}
        errorTitle="Unable to load users"
        errorDescription={getErrorMessage(usersQuery.error, { context: 'load' })}
        emptyTitle="No users found"
        emptyDescription="Users created by admin will appear here."
      />

      <Dialog
        open={isCreateUserOpen}
        onOpenChange={(nextOpen) => {
          setIsCreateUserOpen(nextOpen)
          if (!nextOpen) {
            reset()
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create User</DialogTitle>
            <DialogDescription>Add a new team member account with an initial role.</DialogDescription>
          </DialogHeader>

          <form className="space-y-4" onSubmit={handleSubmit(handleCreateUser)}>
            <div className="grid gap-4 md:grid-cols-2">
              <FormField htmlFor="create-user-name" label="Full name" error={errors.name?.message}>
                <Input
                  id="create-user-name"
                  placeholder="Enter full name"
                  disabled={createUserMutation.isPending}
                  {...register('name')}
                />
              </FormField>

              <FormField htmlFor="create-user-email" label="Email" error={errors.email?.message}>
                <Input
                  id="create-user-email"
                  type="email"
                  placeholder="Enter email address"
                  disabled={createUserMutation.isPending}
                  {...register('email')}
                />
              </FormField>

              <FormField htmlFor="create-user-role" label="Role" error={errors.role?.message}>
                <select
                  id="create-user-role"
                  className="h-9 w-full rounded-lg border border-border bg-background px-3 text-sm text-text-primary focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-600"
                  disabled={createUserMutation.isPending}
                  {...register('role')}
                >
                  <option value="ADMIN">Admin</option>
                  <option value="STORE_KEEPER">Store Keeper</option>
                  <option value="EMPLOYEE">Employee</option>
                </select>
              </FormField>

              <FormField htmlFor="create-user-password" label="Password" error={errors.password?.message}>
                <Input
                  id="create-user-password"
                  type="password"
                  placeholder="Enter temporary password"
                  disabled={createUserMutation.isPending}
                  {...register('password')}
                />
              </FormField>
            </div>

            <DialogFormActions
              isSubmitting={createUserMutation.isPending}
              submitLabel="Create User"
              submittingLabel="Creating..."
              onCancel={() => setIsCreateUserOpen(false)}
            />
          </form>
        </DialogContent>
      </Dialog>
    </section>
  )
}
