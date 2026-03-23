import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { useLocation, useNavigate } from 'react-router-dom'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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
      <div className="w-full max-w-sm">
        <div className="rounded-xl border border-border bg-surface-raised p-6 shadow-sm">
          <p className="text-caption font-medium uppercase tracking-wider text-text-secondary">Internal Access</p>
          <h1 className="mt-2 text-h1 text-text-primary">{APP_NAME}</h1>
          <p className="mt-1 text-body-sm text-text-secondary">Sign in with your company account</p>

          <form className="mt-6 space-y-4" onSubmit={handleSubmit(onSubmit)}>
            {serverError ? (
              <p className="rounded-lg border border-error/30 bg-error/5 px-3 py-2 text-body-sm text-error" role="alert">
                {serverError}
              </p>
            ) : null}

            <div>
              <label className="mb-1.5 block text-body font-medium text-text-primary" htmlFor="email">
                Email
              </label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                {...register('email')}
              />
              {errors.email ? <p className="mt-1 text-body-sm text-error" role="alert">{errors.email.message}</p> : null}
            </div>

            <div>
              <label className="mb-1.5 block text-body font-medium text-text-primary" htmlFor="password">
                Password
              </label>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                {...register('password')}
              />
              {errors.password ? <p className="mt-1 text-body-sm text-error" role="alert">{errors.password.message}</p> : null}
            </div>

            <Button type="submit" className="w-full" disabled={isSubmitting} aria-busy={isSubmitting}>
              {isSubmitting ? 'Signing in...' : 'Sign in'}
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}
