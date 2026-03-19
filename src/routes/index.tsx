import { createBrowserRouter, Navigate } from 'react-router-dom'

import { AppShell } from '@/components/layout/AppShell'
import { AdminAuditLogPage } from '@/pages/admin/AuditLogPage'
import { AdminDashboardPage } from '@/pages/admin/DashboardPage'
import { AdminOrdersPage } from '@/pages/admin/OrdersPage'
import { AdminProductDetailPage } from '@/pages/admin/ProductDetailPage'
import { AdminProductsPage } from '@/pages/admin/ProductsPage'
import { AdminProjectsPage } from '@/pages/admin/ProjectsPage'
import { AdminRequestsPage } from '@/pages/admin/RequestsPage'
import { AdminUserDetailPage } from '@/pages/admin/UserDetailPage'
import { AdminUsersPage } from '@/pages/admin/UsersPage'
import { EmployeeDashboardPage } from '@/pages/employee/DashboardPage'
import { EmployeeNewRequestPage } from '@/pages/employee/NewRequestPage'
import { EmployeeRequestDetailPage } from '@/pages/employee/RequestDetailPage'
import { EmployeeRequestsPage } from '@/pages/employee/RequestsPage'
import { LoginPage } from '@/pages/auth/LoginPage'
import { StoreKeeperDashboardPage } from '@/pages/store-keeper/DashboardPage'
import { StoreKeeperInventoryPage } from '@/pages/store-keeper/InventoryPage'
import { StoreKeeperOrdersPage } from '@/pages/store-keeper/OrdersPage'
import { StoreKeeperRequestDetailPage } from '@/pages/store-keeper/RequestDetailPage'
import { StoreKeeperRequestsPage } from '@/pages/store-keeper/RequestsPage'

import { ProtectedRoute } from './ProtectedRoute'

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    element: <ProtectedRoute allowRoles={['ADMIN', 'STORE_KEEPER', 'EMPLOYEE']} />,
    children: [
      {
        element: <AppShell />,
        children: [
          {
            element: <ProtectedRoute allowRoles={['ADMIN']} />,
            children: [
              { path: '/admin/dashboard', element: <AdminDashboardPage /> },
              { path: '/admin/users', element: <AdminUsersPage /> },
              { path: '/admin/users/:id', element: <AdminUserDetailPage /> },
              { path: '/admin/products', element: <AdminProductsPage /> },
              { path: '/admin/products/:id', element: <AdminProductDetailPage /> },
              { path: '/admin/projects', element: <AdminProjectsPage /> },
              { path: '/admin/requests', element: <AdminRequestsPage /> },
              { path: '/admin/orders', element: <AdminOrdersPage /> },
              { path: '/admin/audit', element: <AdminAuditLogPage /> },
            ],
          },
          {
            element: <ProtectedRoute allowRoles={['STORE_KEEPER']} />,
            children: [
              { path: '/store-keeper/dashboard', element: <StoreKeeperDashboardPage /> },
              { path: '/store-keeper/requests', element: <StoreKeeperRequestsPage /> },
              { path: '/store-keeper/requests/:id', element: <StoreKeeperRequestDetailPage /> },
              { path: '/store-keeper/inventory', element: <StoreKeeperInventoryPage /> },
              { path: '/store-keeper/orders', element: <StoreKeeperOrdersPage /> },
            ],
          },
          {
            element: <ProtectedRoute allowRoles={['EMPLOYEE']} />,
            children: [
              { path: '/employee/dashboard', element: <EmployeeDashboardPage /> },
              { path: '/employee/requests/new', element: <EmployeeNewRequestPage /> },
              { path: '/employee/requests', element: <EmployeeRequestsPage /> },
              { path: '/employee/requests/:id', element: <EmployeeRequestDetailPage /> },
            ],
          },
        ],
      },
    ],
  },
  {
    path: '*',
    element: <Navigate to="/login" replace />,
  },
])
