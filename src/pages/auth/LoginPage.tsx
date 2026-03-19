import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { useLocation, useNavigate } from 'react-router-dom'

import { Button } from '@/components/ui/button'
import { useLogin } from '@/hooks/useAuth'
import { APP_NAME } from '@/lib/constants'
import { loginSchema, type LoginFormValues } from '@/lib/validators'
import { roleRoutes } from '@/routes/roleRoutes'

export function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const loginMutation = useLogin()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  })

  const onSubmit = async (values: LoginFormValues) => {
    const response = await loginMutation.mutateAsync(values)
    const user = response.user

    const redirectPath = (location.state as { from?: { pathname?: string } } | null)?.from?.pathname
    navigate(redirectPath ?? roleRoutes[user.role], { replace: true })
  }

  const isSubmitting = loginMutation.isPending
  const serverError = loginMutation.error instanceof Error ? loginMutation.error.message : null

  return (
    <div className="flex min-h-screen items-center justify-center bg-page p-4">
      <div className="w-full max-w-md rounded-2xl border border-border bg-surface-raised p-6 shadow-lg">
        <p className="text-sm uppercase tracking-[0.16em] text-brand-700">Internal Access</p>
        <h1 className="mt-2 font-heading text-3xl font-bold text-text-primary">{APP_NAME}</h1>
        <p className="mt-1 text-sm text-text-secondary">Sign in with your company account</p>

        <form className="mt-6 space-y-4" onSubmit={handleSubmit(onSubmit)}>
          {serverError ? (
            <p className="rounded-md border border-error bg-surface px-3 py-2 text-sm text-error" role="alert">
              {serverError}
            </p>
          ) : null}

          <div>
            <label className="mb-1 block text-sm font-medium text-text-primary" htmlFor="email">
              Email
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-600"
              {...register('email')}
            />
            {errors.email ? <p className="mt-1 text-xs text-error">{errors.email.message}</p> : null}
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-text-primary" htmlFor="password">
              Password
            </label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-600"
              {...register('password')}
            />
            {errors.password ? <p className="mt-1 text-xs text-error">{errors.password.message}</p> : null}
          </div>

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? 'Signing in...' : 'Sign in'}
          </Button>
        </form>
      </div>
    </div>
  )
}
