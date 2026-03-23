import { useState } from 'react'
import { Outlet } from 'react-router-dom'

import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet'
import { useSSE } from '@/hooks/useSSE'
import { useAuthStore } from '@/store/authStore'

import { Sidebar } from './Sidebar'
import { Topbar } from './Topbar'

export function AppShell() {
  const role = useAuthStore((state) => state.user?.role)
  const [mobileNavOpen, setMobileNavOpen] = useState(false)

  useSSE(role === 'ADMIN' || role === 'STORE_KEEPER')

  return (
    <div className="min-h-screen bg-page lg:flex">
      <Sidebar />

      <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
        <SheetContent side="left" className="w-[18rem] p-0 sm:max-w-[18rem] lg:hidden">
          <SheetTitle className="sr-only">Navigation menu</SheetTitle>
          <Sidebar mobile onNavigate={() => setMobileNavOpen(false)} />
        </SheetContent>
      </Sheet>

      <div className="flex min-h-screen flex-1 flex-col">
        <Topbar onOpenMobileNav={() => setMobileNavOpen(true)} />
        <main className="flex-1 bg-page p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
