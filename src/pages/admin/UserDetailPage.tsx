import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { toast } from 'sonner'

import { PageHeader } from '@/components/layout/PageHeader'
import { EmptyState } from '@/components/shared/EmptyState'
import { PageSkeleton } from '@/components/shared/PageSkeleton'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useUpdateUser, useUser } from '@/hooks/useUsers'
import type { UserRole } from '@/types/auth'

const roleOptions: UserRole[] = ['ADMIN', 'STORE_KEEPER', 'EMPLOYEE']

export function AdminUserDetailPage() {
  const navigate = useNavigate()
  const { id = '' } = useParams()
  const userQuery = useUser(id)
  const updateUserMutation = useUpdateUser()

  const [name, setName] = useState('')
  const [role, setRole] = useState<UserRole>('EMPLOYEE')
  const [isActive, setIsActive] = useState(true)

  if (userQuery.isLoading) {
    return <PageSkeleton />
  }

  const userProfile = userQuery.data?.profile
  if (!userProfile) {
    return <EmptyState title="User not found" description="The selected user could not be loaded." />
  }

  const initializedName = name || userProfile.name
  const initializedRole = role || userProfile.role

  const handleSave = async () => {
    await updateUserMutation.mutateAsync({
      id: userProfile.id,
      payload: {
        name: initializedName,
        role: initializedRole,
        isActive,
      },
    })
    toast.success('User updated')
  }

  return (
    <section className="space-y-6">
      <PageHeader
        title="User Detail"
        subtitle={userProfile.email}
        action={
          <Button type="button" variant="secondary" onClick={() => navigate('/admin/users')}>
            Back
          </Button>
        }
      />

      <section className="rounded-xl border border-border bg-surface-raised p-5">
        <h2 className="text-lg font-semibold text-text-primary">Profile</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-text-primary" htmlFor="user-name">
              Name
            </label>
            <Input id="user-name" value={initializedName} onChange={(event) => setName(event.target.value)} />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-text-primary" htmlFor="user-role">
              Role
            </label>
            <select
              id="user-role"
              className="h-9 w-full rounded-lg border border-border bg-background px-3 text-sm text-text-primary focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-600"
              value={initializedRole}
              onChange={(event) => setRole(event.target.value as UserRole)}
            >
              {roleOptions.map((roleOption) => (
                <option key={roleOption} value={roleOption}>
                  {roleOption}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-4 flex items-center gap-2">
          <input
            id="user-active"
            type="checkbox"
            checked={isActive}
            onChange={(event) => setIsActive(event.target.checked)}
          />
          <label htmlFor="user-active" className="text-sm text-text-primary">
            Active account
          </label>
        </div>

        <div className="mt-6 flex justify-end">
          <Button type="button" onClick={handleSave} disabled={updateUserMutation.isPending}>
            {updateUserMutation.isPending ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </section>
    </section>
  )
}
