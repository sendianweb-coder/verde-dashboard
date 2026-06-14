import { createBrowserRouter, Navigate } from 'react-router-dom'

import { AppShell } from '@/components/layout/AppShell'
import { AdminAuditLogPage } from '@/pages/admin/AuditLogPage'
import { AdminDashboardPage } from '@/pages/admin/DashboardPage'
import { AdminOrdersPage } from '@/pages/admin/OrdersPage'
import { AdminProductDetailPage } from '@/pages/admin/ProductDetailPage'
import { AdminProjectDetailPage } from '@/pages/admin/ProjectDetailPage'
import { AdminProductsPage } from '@/pages/admin/ProductsPage'
import { AdminRequestDetailPage } from '@/pages/admin/RequestDetailPage'
import { AdminProjectsPage } from '@/pages/admin/ProjectsPage'
import { AdminRequestsPage } from '@/pages/admin/RequestsPage'
import { AdminUserDetailPage } from '@/pages/admin/UserDetailPage'
import { AdminUsersPage } from '@/pages/admin/UsersPage'
import { EmployeeDashboardPage } from '@/pages/employee/DashboardPage'
import { EmployeeNewRequestPage } from '@/pages/employee/NewRequestPage'
import { EmployeeProjectDetailPage } from '@/pages/employee/ProjectDetailPage'
import { EmployeeProjectsPage } from '@/pages/employee/ProjectsPage'
import { EmployeeRequestDetailPage } from '@/pages/employee/RequestDetailPage'
import { EmployeeRequestsPage } from '@/pages/employee/RequestsPage'
import { LoginPage } from '@/pages/auth/LoginPage'
import { StoreKeeperDashboardPage } from '@/pages/store-keeper/DashboardPage'
import { StoreKeeperInventoryPage } from '@/pages/store-keeper/InventoryPage'
import { StoreKeeperOrdersPage } from '@/pages/store-keeper/OrdersPage'
import { StoreKeeperProductDetailPage } from '@/pages/store-keeper/ProductDetailPage'
import { StoreKeeperProjectDetailPage } from '@/pages/store-keeper/ProjectDetailPage'
import { StoreKeeperProjectsPage } from '@/pages/store-keeper/ProjectsPage'
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
              { path: '/admin/projects/:id', element: <AdminProjectDetailPage /> },
              { path: '/admin/requests', element: <AdminRequestsPage /> },
              { path: '/admin/requests/:id', element: <AdminRequestDetailPage /> },
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
              { path: '/store-keeper/projects', element: <StoreKeeperProjectsPage /> },
              { path: '/store-keeper/projects/:id', element: <StoreKeeperProjectDetailPage /> },
              { path: '/store-keeper/inventory', element: <StoreKeeperInventoryPage /> },
              { path: '/store-keeper/products/:id', element: <StoreKeeperProductDetailPage /> },
              { path: '/store-keeper/inventory/:id', element: <StoreKeeperProductDetailPage /> },
              { path: '/store-keeper/orders', element: <StoreKeeperOrdersPage /> },
            ],
          },
          {
            element: <ProtectedRoute allowRoles={['EMPLOYEE']} />,
            children: [
              { path: '/employee/dashboard', element: <EmployeeDashboardPage /> },
              { path: '/employee/projects', element: <EmployeeProjectsPage /> },
              { path: '/employee/projects/:id', element: <EmployeeProjectDetailPage /> },
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
