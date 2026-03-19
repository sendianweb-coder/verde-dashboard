import { Outlet } from 'react-router-dom'

import { useSSE } from '@/hooks/useSSE'
import { useAuthStore } from '@/store/authStore'

import { Sidebar } from './Sidebar'
import { Topbar } from './Topbar'

export function AppShell() {
  const role = useAuthStore((state) => state.user?.role)
  useSSE(role === 'ADMIN' || role === 'STORE_KEEPER')

  return (
    <div className="min-h-screen lg:flex">
      <Sidebar />
      <div className="flex min-h-screen flex-1 flex-col">
        <Topbar />
        <main className="flex-1 p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
