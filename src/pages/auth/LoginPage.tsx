import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { useLocation, useNavigate } from 'react-router-dom'

import { Button } from '@/components/ui/button'
import { APP_NAME } from '@/lib/constants'
import { loginSchema, type LoginFormValues } from '@/lib/validators'
import { roleRoutes } from '@/routes/roleRoutes'
import { useAuthStore } from '@/store/authStore'

export function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const setUser = useAuthStore((state) => state.setUser)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  })

  const onSubmit = async (values: LoginFormValues) => {
    await Promise.resolve(values)

    const user = {
      id: crypto.randomUUID(),
      fullName: 'Verde Staff',
      email: values.email,
      role: 'ADMIN' as const,
    }

    setUser(user)

    const redirectPath = (location.state as { from?: { pathname?: string } } | null)?.from?.pathname
    navigate(redirectPath ?? roleRoutes[user.role], { replace: true })
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-md rounded-2xl border border-emerald-100 bg-white/90 p-6 shadow-lg backdrop-blur">
        <p className="text-sm uppercase tracking-[0.16em] text-emerald-700">Internal Access</p>
        <h1 className="mt-2 font-[var(--font-heading)] text-3xl text-slate-900">{APP_NAME}</h1>
        <p className="mt-1 text-sm text-slate-600">Sign in with your company account</p>

        <form className="mt-6 space-y-4" onSubmit={handleSubmit(onSubmit)}>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700" htmlFor="email">
              Email
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none ring-emerald-500 transition focus:ring-2"
              {...register('email')}
            />
            {errors.email ? <p className="mt-1 text-xs text-rose-600">{errors.email.message}</p> : null}
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700" htmlFor="password">
              Password
            </label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none ring-emerald-500 transition focus:ring-2"
              {...register('password')}
            />
            {errors.password ? <p className="mt-1 text-xs text-rose-600">{errors.password.message}</p> : null}
          </div>

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? 'Signing in...' : 'Sign in'}
          </Button>
        </form>
      </div>
    </div>
  )
}
