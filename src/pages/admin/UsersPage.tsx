import type { ColumnDef } from '@tanstack/react-table'
import { zodResolver } from '@hookform/resolvers/zod'
import { Calendar, CircleDot, Eye, Filter, MoreHorizontal, Trash2 } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'

import { PageHeader } from '@/components/layout/PageHeader'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { DataTable } from '@/components/shared/DataTable'
import { DialogFormActions } from '@/components/shared/DialogFormActions'
import { FormField } from '@/components/shared/FormField'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
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
import { useCreateUser, useDeleteUser, useUsers } from '@/hooks/useUsers'
import { getErrorMessage } from '@/lib/errors'
import { cn } from '@/lib/utils'
import { createUserSchema, type CreateUserFormValues } from '@/lib/validators'
import type { User } from '@/types/user'

type UserStatusFilter = 'all' | 'active' | 'inactive'
type UserDateFilter = 'all' | 'today' | 'yesterday' | 'last7days' | 'last30days'

const roleLabels: Record<User['role'], string> = {
  ADMIN: 'Admin',
  STORE_KEEPER: 'Store Keeper',
  EMPLOYEE: 'Employee',
}

const roleStyles: Record<User['role'], string> = {
  ADMIN: 'bg-approved-bg text-approved-text',
  STORE_KEEPER: 'bg-picked-up-bg text-picked-up-text',
  EMPLOYEE: 'bg-surface text-text-secondary',
}

const statusFilterLabels: Record<UserStatusFilter, string> = {
  all: 'All Status',
  active: 'Active',
  inactive: 'Inactive',
}

const dateFilterLabels: Record<UserDateFilter, string> = {
  all: 'Joined Date',
  today: 'Today',
  yesterday: 'Yesterday',
  last7days: 'Last 7 days',
  last30days: 'Last 30 days',
}

const userDateFormatter = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
})

function getUserInitials(name: string) {
  const initials = name
    .split(' ')
    .filter(Boolean)
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  return initials || 'U'
}

function UserRoleBadge({ role }: { role: User['role'] }) {
  return (
    <span className={cn('inline-flex rounded-md px-2 py-0.5 text-xs font-medium', roleStyles[role])}>
      {roleLabels[role]}
    </span>
  )
}

function UserStatusBadge({ isActive }: { isActive: boolean }) {
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

function formatUserDate(value: string) {
  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return 'Unknown'
  }

  return userDateFormatter.format(date)
}

function isWithinDateFilter(value: string, filter: UserDateFilter) {
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
  const startOfYesterday = startOfToday - day

  if (filter === 'today') {
    return timestamp >= startOfToday && timestamp < startOfTomorrow
  }

  if (filter === 'yesterday') {
    return timestamp >= startOfYesterday && timestamp < startOfToday
  }

  if (filter === 'last7days') {
    return timestamp >= now - 7 * day && timestamp <= now
  }

  return timestamp >= now - 30 * day && timestamp <= now
}

export function AdminUsersPage() {
  const navigate = useNavigate()
  const [isCreateUserOpen, setIsCreateUserOpen] = useState(false)
  const [userPendingDeletion, setUserPendingDeletion] = useState<User | null>(null)
  const [roleFilter, setRoleFilter] = useState<'all' | User['role']>('all')
  const [statusFilter, setStatusFilter] = useState<UserStatusFilter>('all')
  const [dateFilter, setDateFilter] = useState<UserDateFilter>('all')
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

  const filteredUsers = useMemo(() => {
    const users = usersQuery.data ?? []

    return users
      .filter((user) => roleFilter === 'all' || user.role === roleFilter)
      .filter((user) => {
        if (statusFilter === 'all') {
          return true
        }

        return statusFilter === 'active' ? user.isActive : !user.isActive
      })
      .filter((user) => isWithinDateFilter(user.createdAt, dateFilter))
      .sort((firstUser, secondUser) => {
      if (firstUser.isActive === secondUser.isActive) {
        return 0
      }

      return firstUser.isActive ? -1 : 1
    })
  }, [dateFilter, roleFilter, statusFilter, usersQuery.data])

  const hasActiveFilters = roleFilter !== 'all' || statusFilter !== 'all' || dateFilter !== 'all'

  const clearFilters = () => {
    setRoleFilter('all')
    setStatusFilter('all')
    setDateFilter('all')
  }

  const columns = useMemo<Array<ColumnDef<User>>>(
    () => [
      {
        accessorKey: 'name',
        header: 'User',
        cell: ({ row }) => {
          const user = row.original

          return (
            <div className="flex items-center gap-2.5">
              <Avatar className="size-7">
                <AvatarFallback className="text-[10px] font-semibold">{getUserInitials(user.name)}</AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <p className="font-medium text-text-primary">{user.name}</p>
              </div>
            </div>
          )
        },
      },
      {
        accessorKey: 'email',
        header: 'Email Address',
        cell: ({ row }) => <span className="text-sm text-text-secondary">{row.original.email}</span>,
      },
      {
        accessorKey: 'role',
        header: 'Role',
        cell: ({ row }) => <UserRoleBadge role={row.original.role} />,
      },
      {
        accessorKey: 'isActive',
        header: 'Status',
        cell: ({ row }) => <UserStatusBadge isActive={row.original.isActive} />,
      },
      {
        accessorKey: 'createdAt',
        header: 'Joined Date',
        cell: ({ row }) => <span className="text-sm tabular-nums text-text-secondary">{formatUserDate(row.original.createdAt)}</span>,
      },
      {
        id: 'actions',
        enableSorting: false,
        cell: ({ row }) => (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button type="button" variant="ghost" size="icon" className="size-8" aria-label="Open user actions">
                <MoreHorizontal className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuItem onSelect={() => navigate(`/admin/users/${row.original.id}`)}>
                <Eye className="size-4" />
                View profile
              </DropdownMenuItem>
              {row.original.isActive ? (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="text-error focus:text-error" onSelect={() => setUserPendingDeletion(row.original)}>
                    <Trash2 className="size-4" />
                    Delete user
                  </DropdownMenuItem>
                </>
              ) : null}
            </DropdownMenuContent>
          </DropdownMenu>
        ),
      },
    ],
    [navigate],
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
        title="User List"
        data={filteredUsers}
        columns={columns}
        enableRowSelection
        getRowId={(user) => user.id}
        resultsLabel="users"
        searchPlaceholder="Search users..."
        initialPageSize={10}
        filters={
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button type="button" variant="outline" size="sm" className="h-9 gap-2">
                <Filter className="size-4" />
                Filter
                {hasActiveFilters ? <span className="size-1.5 rounded-full bg-brand-600" /> : null}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel className="text-xs text-text-secondary">Role</DropdownMenuLabel>
              <DropdownMenuCheckboxItem checked={roleFilter === 'all'} onCheckedChange={() => setRoleFilter('all')}>
                All Roles
              </DropdownMenuCheckboxItem>
              {(Object.keys(roleLabels) as Array<User['role']>).map((role) => (
                <DropdownMenuCheckboxItem key={role} checked={roleFilter === role} onCheckedChange={() => setRoleFilter(role)}>
                  {roleLabels[role]}
                </DropdownMenuCheckboxItem>
              ))}

              <DropdownMenuSeparator />
              <DropdownMenuLabel className="text-xs text-text-secondary">Status</DropdownMenuLabel>
              {(Object.keys(statusFilterLabels) as UserStatusFilter[]).map((status) => (
                <DropdownMenuCheckboxItem key={status} checked={statusFilter === status} onCheckedChange={() => setStatusFilter(status)}>
                  <span className="flex items-center gap-2">
                    <CircleDot className="size-3.5 text-text-muted" />
                    {statusFilterLabels[status]}
                  </span>
                </DropdownMenuCheckboxItem>
              ))}

              <DropdownMenuSeparator />
              <DropdownMenuLabel className="text-xs text-text-secondary">Joined Date</DropdownMenuLabel>
              {(Object.keys(dateFilterLabels) as UserDateFilter[]).map((dateKey) => (
                <DropdownMenuCheckboxItem key={dateKey} checked={dateFilter === dateKey} onCheckedChange={() => setDateFilter(dateKey)}>
                  <span className="flex items-center gap-2">
                    <Calendar className="size-3.5 text-text-muted" />
                    {dateFilterLabels[dateKey]}
                  </span>
                </DropdownMenuCheckboxItem>
              ))}

              {hasActiveFilters ? (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onSelect={clearFilters}>Clear filters</DropdownMenuItem>
                </>
              ) : null}
            </DropdownMenuContent>
          </DropdownMenu>
        }
        isLoading={usersQuery.isLoading}
        hasError={usersQuery.isError}
        errorTitle="Unable to load users"
        errorDescription={getErrorMessage(usersQuery.error, { context: 'load' })}
        emptyTitle="No users found"
        emptyDescription="Users created by admin will appear here."
      />

      <ConfirmDialog
        open={Boolean(userPendingDeletion)}
        onOpenChange={(open) => {
          if (!open) {
            setUserPendingDeletion(null)
          }
        }}
        title="Delete user"
        description={
          userPendingDeletion
            ? `Are you sure you want to delete ${userPendingDeletion.name}? This action cannot be undone.`
            : 'Are you sure you want to delete this user account? This action cannot be undone.'
        }
        confirmLabel="Delete"
        variant="destructive"
        isLoading={deleteUserMutation.isPending}
        onConfirm={async () => {
          if (!userPendingDeletion) {
            return
          }

          try {
            await deleteUserMutation.mutateAsync(userPendingDeletion.id)
            toast.success('User deleted')
          } catch (error) {
            toast.error(getErrorMessage(error, { context: 'update' }))
            throw error
          }
        }}
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
