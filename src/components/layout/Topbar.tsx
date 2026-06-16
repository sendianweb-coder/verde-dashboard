import { zodResolver } from '@hookform/resolvers/zod'
import { Eye, EyeOff, KeyRound, Menu, Search, User } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'

import { DialogFormActions } from '@/components/shared/DialogFormActions'
import { FormField } from '@/components/shared/FormField'
import { NotificationBell } from '@/components/notifications/NotificationBell'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { useChangePassword, useLogout } from '@/hooks/useAuth'
import { getErrorMessage } from '@/lib/errors'
import { changePasswordSchema, type ChangePasswordFormValues } from '@/lib/validators'
import { useAuthStore } from '@/store/authStore'

interface TopbarProps {
  onOpenMobileNav?: () => void
}

export function Topbar({ onOpenMobileNav }: TopbarProps) {
  const user = useAuthStore((state) => state.user)
  const logoutMutation = useLogout()
  const changePasswordMutation = useChangePassword()
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false)
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ChangePasswordFormValues>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      oldPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  })

  const initials =
    user?.name
      ?.split(' ')
      .map((word) => word[0])
      .join('')
      .slice(0, 2)
      .toUpperCase() ?? 'VS'

  const handleSignOut = async () => {
    try {
      await logoutMutation.mutateAsync()
      window.location.href = '/login'
    } catch (error) {
      toast.error(getErrorMessage(error, { context: 'logout' }))
    }
  }

  const closeChangePasswordDialog = () => {
    setIsChangePasswordOpen(false)
    setShowCurrentPassword(false)
    setShowNewPassword(false)
    setShowConfirmPassword(false)
    reset()
  }

  const handleChangePassword = async (values: ChangePasswordFormValues) => {
    try {
      await changePasswordMutation.mutateAsync({
        oldPassword: values.oldPassword,
        newPassword: values.newPassword,
      })
      toast.success('Password updated successfully')
      closeChangePasswordDialog()
    } catch (error) {
      toast.error(getErrorMessage(error, { context: 'update' }))
    }
  }

  return (
    <>
      <header className="flex h-15 items-center justify-between border-b border-border bg-background px-4 lg:px-6">
        <div className="flex items-center gap-3">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="lg:hidden"
            aria-label="Open navigation menu"
            onClick={onOpenMobileNav}
          >
            <Menu className="h-5 w-5" />
          </Button>

          <div className="relative w-52 sm:w-64">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
            <Input
              aria-label="Search"
              placeholder="Search..."
              className="h-9 rounded-lg border-border bg-surface pl-9 text-sm text-text-primary placeholder:text-text-muted"
            />
          </div>
        </div>

        <div className="flex items-center gap-3">
          <NotificationBell />

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="flex items-center gap-2 rounded-lg px-2 py-1.5 transition-colors hover:bg-surface"
                aria-label="Open profile menu"
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-100 text-xs font-semibold text-brand-700">
                  {initials}
                </span>
                <span className="hidden text-sm font-medium text-text-primary sm:inline">{user?.name ?? 'Staff'}</span>
              </button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end" className="w-48 border-border bg-surface-raised">
              <div className="px-2 py-1.5">
                <p className="truncate text-sm font-medium text-text-primary">{user?.name ?? 'Staff'}</p>
                <p className="text-xs text-text-secondary">{user?.role ?? 'GUEST'}</p>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="cursor-pointer text-text-primary">
                <User className="h-4 w-4 text-text-secondary" />
                My Profile
              </DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer text-text-primary" onSelect={() => setIsChangePasswordOpen(true)}>
                <KeyRound className="h-4 w-4 text-text-secondary" />
                Change Password
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="cursor-pointer text-error focus:bg-rejected-bg focus:text-error"
                onClick={() => {
                  void handleSignOut()
                }}
                disabled={logoutMutation.isPending}
              >
                {logoutMutation.isPending ? 'Signing out...' : 'Sign Out'}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      <Dialog
        open={isChangePasswordOpen}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) {
            closeChangePasswordDialog()
          } else {
            setIsChangePasswordOpen(true)
          }
        }}
      >
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Change password</DialogTitle>
            <DialogDescription>Update the password for your current account.</DialogDescription>
          </DialogHeader>

          <form className="space-y-4" onSubmit={handleSubmit(handleChangePassword)}>
            <FormField htmlFor="current-password" label="Current password" error={errors.oldPassword?.message}>
              <div className="relative">
                <Input
                  id="current-password"
                  type={showCurrentPassword ? 'text' : 'password'}
                  placeholder="Enter current password"
                  className="pr-10"
                  autoComplete="current-password"
                  disabled={changePasswordMutation.isPending}
                  {...register('oldPassword')}
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted transition-colors hover:text-text-primary focus:outline-none disabled:opacity-50"
                  disabled={changePasswordMutation.isPending}
                  aria-label={showCurrentPassword ? 'Hide current password' : 'Show current password'}
                >
                  {showCurrentPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </FormField>

            <FormField htmlFor="new-password" label="New password" error={errors.newPassword?.message}>
              <div className="relative">
                <Input
                  id="new-password"
                  type={showNewPassword ? 'text' : 'password'}
                  placeholder="Enter new password"
                  className="pr-10"
                  autoComplete="new-password"
                  disabled={changePasswordMutation.isPending}
                  {...register('newPassword')}
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted transition-colors hover:text-text-primary focus:outline-none disabled:opacity-50"
                  disabled={changePasswordMutation.isPending}
                  aria-label={showNewPassword ? 'Hide new password' : 'Show new password'}
                >
                  {showNewPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </FormField>

            <FormField htmlFor="confirm-new-password" label="Confirm new password" error={errors.confirmPassword?.message}>
              <div className="relative">
                <Input
                  id="confirm-new-password"
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="Confirm new password"
                  className="pr-10"
                  autoComplete="new-password"
                  disabled={changePasswordMutation.isPending}
                  {...register('confirmPassword')}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted transition-colors hover:text-text-primary focus:outline-none disabled:opacity-50"
                  disabled={changePasswordMutation.isPending}
                  aria-label={showConfirmPassword ? 'Hide password confirmation' : 'Show password confirmation'}
                >
                  {showConfirmPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </FormField>

            <DialogFormActions
              isSubmitting={changePasswordMutation.isPending}
              submitLabel="Update Password"
              submittingLabel="Updating..."
              onCancel={closeChangePasswordDialog}
            />
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
