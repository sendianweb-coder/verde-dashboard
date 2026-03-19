# Verde Support App — Frontend Technical PRD

**Version:** 1.0 (MVP)
**Date:** March 19, 2026
**Status:** Draft — Pending Client Approval
**Prepared by:** Product Discussion Session

---

## 1. Overview

### 1.1 Purpose
This document defines the complete technical and design requirements for the **Verde Support App frontend** — a private internal Single Page Application (SPA) for Verde staff only. It covers architecture, screen inventory, component design, data layer, form specifications, and non-functional requirements. This document is intended as a developer handoff reference.

### 1.2 App Type
Internal staff-only SPA. No customer-facing pages. All customer interactions remain on the existing WooCommerce store. The Verde App serves three internal roles: Admin, Store Keeper, and Employee.

### 1.3 MVP Scope
- Authentication with role-based access control
- Admin full system management
- Store Keeper approval workflow and inventory management
- Employee internal material request submission and tracking
- Real-time notifications via Server-Sent Events (SSE)

---

## 2. Confirmed Tech Stack

| Layer | Technology | Reason |
|---|---|---|
| Framework | React + Vite | Internal SPA — no SSR or SEO needed |
| Routing | React Router v6 | Simple role-based routing |
| UI Components | shadcn/ui | Accessible, fully owned, customizable |
| Styling | Tailwind CSS | Utility-first, matches Verde brand |
| Server State | TanStack Query | Caching, refetching, background sync |
| Forms | React Hook Form + Zod | Validation aligned with backend rules |
| Global State | Zustand | Minimal — auth + notifications only |
| Real-time | EventSource API (SSE) | Matches server implementation |
| Auth | JWT in httpOnly cookie | Secure, no localStorage exposure |
| Build Tool | Vite | Sub-second HMR, fastest dev experience |
| Hosting | Hostinger Cloud Startup | Static build deployment |

---

## 3. User Roles

| Role | Description | Key Permissions |
|---|---|---|
| ADMIN | Owner — full system control | All read/write, user management, audit log |
| STORE_KEEPER | Inventory and fulfillment | Approve/reject requests, adjust stock, process orders |
| EMPLOYEE | Verde team member | Submit requests, track own request status |

---

## 4. Project Structure

### 4.1 Folder Architecture

| Folder | Purpose |
|---|---|
| `src/components/ui/` | shadcn/ui generated components — owned by the project |
| `src/components/layout/` | AppShell, Sidebar, Topbar, PageHeader |
| `src/components/shared/` | Reusable business components used across roles |
| `src/components/notifications/` | NotificationBell and NotificationDrawer |
| `src/pages/auth/` | Login page |
| `src/pages/admin/` | All 8 Admin screens |
| `src/pages/store-keeper/` | All 5 Store Keeper screens |
| `src/pages/employee/` | All 4 Employee screens |
| `src/routes/` | Router setup, ProtectedRoute guard, role route map |
| `src/hooks/` | TanStack Query hooks per domain + SSE hook |
| `src/api/` | Axios client + per-domain API call functions |
| `src/store/` | Zustand stores — authStore, notificationStore |
| `src/types/` | TypeScript interfaces per domain |
| `src/lib/` | Utilities, Zod validators, constants |

### 4.2 Key Files

| File | Purpose |
|---|---|
| `src/routes/index.tsx` | Root router with all role-based route definitions |
| `src/routes/ProtectedRoute.tsx` | JWT + role guard — redirects on mismatch |
| `src/routes/roleRoutes.ts` | Maps each role to its default dashboard path |
| `src/api/client.ts` | Axios base config + 401 auto-logout interceptor |
| `src/store/authStore.ts` | Current user, role, isAuthenticated — persisted |
| `src/store/notificationStore.ts` | SSE notification queue + unread count |
| `src/lib/constants.ts` | Nav items per role, status labels, color maps |
| `src/lib/validators.ts` | All Zod schemas for every form in the app |

---

## 5. Authentication & Route Guards

### 5.1 Login Flow

| Step | Detail |
|---|---|
| Entry point | All unauthenticated users land on `/login` |
| Credential submission | Email + password posted to `POST /api/v1/auth/login` |
| On success | JWT stored in httpOnly cookie, user stored in Zustand, redirect to role dashboard |
| On failure | Inline error message shown below form |
| Session persistence | Zustand persist middleware — survives page refresh |
| Token expiry | 401 response triggers auto-logout + redirect to `/login` |

### 5.2 Role → Default Dashboard Map

| Role | Default Route |
|---|---|
| ADMIN | `/admin/dashboard` |
| STORE_KEEPER | `/store-keeper/dashboard` |
| EMPLOYEE | `/employee/dashboard` |

### 5.3 Route Protection Rules

| Rule | Detail |
|---|---|
| Unauthenticated access | Redirect to `/login` with `state.from` preserved |
| Wrong role access | Redirect to own role dashboard |
| Post-login redirect | Returns user to originally requested URL if available |
| ADMIN access to SK routes | ADMIN can access Store Keeper routes |
| Wildcard fallback | Any unknown path redirects to `/login` |

---

## 6. Screen Inventory

### 6.1 Public Screen (1 screen)

| Screen | Path | Description |
|---|---|---|
| Login | `/login` | Email + password form. No self-registration — admin creates all accounts |

### 6.2 Admin Screens (8 screens)

| Screen | Path | Key Content |
|---|---|---|
| Dashboard | `/admin/dashboard` | Stats row, recent requests, recent orders, low stock alerts, activity feed |
| User Management | `/admin/users` | Users table with role filter, add/edit/deactivate actions |
| User Detail | `/admin/users/:id` | Profile card, activity summary, edit form |
| Product Management | `/admin/products` | Products table with category filter, stock indicators, add/edit/deactivate |
| Product Detail | `/admin/products/:id` | Product info, stock summary, manual adjustment form, movement history |
| Project Management | `/admin/projects` | Projects table, add/edit/deactivate |
| Request Overview | `/admin/requests` | All requests filterable by status, project, date range |
| Order Overview | `/admin/orders` | All customer orders with status management |
| Audit Log | `/admin/audit` | Paginated activity log with actor/entity filters and metadata expand |

### 6.3 Store Keeper Screens (5 screens)

| Screen | Path | Key Content |
|---|---|---|
| Dashboard | `/store-keeper/dashboard` | Live pending requests (SSE), stats row, low stock warnings, notification bell |
| Request Queue | `/store-keeper/requests` | Tabbed by status, urgency indicator, row click to detail |
| Request Detail | `/store-keeper/requests/:id` | Items list, stock availability check, approve/reject/pickup/complete actions, timeline |
| Inventory | `/store-keeper/inventory` | Products table, search + filter, stock adjustment, movement history drawer, CSV export |
| Orders | `/store-keeper/orders` | Customer orders with inline status updates |

### 6.4 Employee Screens (4 screens)

| Screen | Path | Key Content |
|---|---|---|
| Dashboard | `/employee/dashboard` | New Request CTA, active request cards, recent history, monthly stats |
| New Request | `/employee/requests/new` | Project selector, product search, dynamic item builder with live stock check |
| My Requests | `/employee/requests` | Own requests tabbed by status |
| Request Detail | `/employee/requests/:id` | Read-only summary, status badge, approval timeline, cancel button (PENDING only) |

### 6.5 Screen Count Summary

| Role | Screens |
|---|---|
| Public | 1 |
| Admin | 8 |
| Store Keeper | 5 |
| Employee | 4 |
| **Total** | **18** |

---

## 7. Shared Component Design

### 7.1 Layout Components

| Component | Purpose |
|---|---|
| AppShell | Main wrapper — sidebar + topbar + scrollable content area |
| Sidebar | Role-aware navigation rendered from constants config map |
| Topbar | Current user name, role badge, notification bell, profile dropdown |
| PageHeader | Reusable page title + breadcrumb trail |

### 7.2 Business Components

| Component | Used By | Purpose |
|---|---|---|
| StatusBadge | All roles | Color-coded pill for request and order statuses |
| StockIndicator | Admin, SK | Visual stock health — In Stock / Low / Critical / Out |
| DataTable | All roles | Reusable sortable, filterable, paginated table (TanStack Table v8) |
| ConfirmDialog | Admin, SK | Confirmation modal for destructive or irreversible actions |
| EmptyState | All roles | Illustrated empty list with context-appropriate CTA |
| LoadingSpinner | All roles | Consistent loading feedback across all async operations |

### 7.3 Notification Components

| Component | Purpose |
|---|---|
| NotificationBell | Topbar icon with unread count badge — opens notification popover |
| NotificationDrawer | List of SSE events with type, message, timestamp, and link to related record |

### 7.4 Sidebar Navigation Config

Each role has a dedicated navigation array in `src/lib/constants.ts`. Items include label, path, and Lucide icon. Active item highlighted by current route match.

| Role | Nav Items |
|---|---|
| ADMIN | Dashboard, Users, Products, Projects, Requests, Orders, Audit Log |
| STORE_KEEPER | Dashboard, Requests, Inventory, Orders |
| EMPLOYEE | Dashboard, New Request, My Requests |

---

## 8. TanStack Query — API Hooks

All server state managed through domain-specific hooks. No direct API calls from components.

### 8.1 Architecture Rules

| Rule | Detail |
|---|---|
| Query keys | Consistent array format per domain |
| Stale time | 60s for lists, 30s for detail queries |
| Cache invalidation | Every mutation invalidates its domain query key on success |
| Error handling | All hooks expose error state — UI shows toast on failure |
| SSE sync | SSE events trigger queryClient.invalidateQueries() on affected domains |

### 8.2 Hook Inventory

| Domain | Hook File | Queries | Mutations |
|---|---|---|---|
| Auth | `useAuth.ts` | 2 | 2 |
| Users | `useUsers.ts` | 2 | 3 |
| Products | `useProducts.ts` | 3 | 4 |
| Categories | `useCategories.ts` | 1 | 3 |
| Projects | `useProjects.ts` | 1 | 3 |
| Requests | `useRequests.ts` | 4 | 5 |
| Orders | `useOrders.ts` | 3 | 2 |
| Audit Log | `useAuditLog.ts` | 1 | 0 |
| SSE | `useSSE.ts` | 1 | — |
| **Total** | | **18** | **22** |

### 8.3 SSE Hook Behavior

| Event | Action |
|---|---|
| `new-request` | Add to notification store + invalidate requests query |
| `stock-updated` | Silently invalidate products query |
| `request-status-changed` | Invalidate requests query |
| Connection error | Close gracefully, retry on next mount |
| Who connects | ADMIN and STORE_KEEPER only — on app mount |

---

## 9. Form Specifications

All forms use React Hook Form for state and Zod for validation. All forms follow: inline field errors, disabled submit while loading, success toast on completion.

### 9.1 Form Inventory

| Form | Used By | Trigger |
|---|---|---|
| Login | All | Public page load |
| Create / Edit User | Admin | Users page modal |
| Create / Edit Product | Admin | Products page modal |
| Stock Adjustment | Admin, Store Keeper | Product detail / Inventory page |
| Create / Edit Category | Admin | Inline modal |
| Create / Edit Project | Admin | Inline modal |
| New Internal Request | Employee | Dedicated page |
| Approve / Reject Request | Store Keeper | Request detail action bar |
| Change Password | All roles | Profile dropdown |
| Update Order Status | Admin, Store Keeper | Order detail inline |

### 9.2 Form Field Specifications

#### Login Form
| Field | Validation |
|---|---|
| Email | Required, valid email format |
| Password | Required, min 8 characters |

#### Create / Edit User Form
| Field | Validation |
|---|---|
| Full name | Required, min 2 chars, max 60 chars |
| Email | Required, valid email, unique (server-side) |
| Role | Required — ADMIN, STORE_KEEPER, EMPLOYEE |
| Password | Required on create only, min 8 chars, hidden on edit |

#### Create / Edit Product Form
| Field | Validation |
|---|---|
| Product name | Required, min 2 chars, max 100 chars |
| SKU | Required, unique, auto-uppercased |
| Category | Optional — from categories list |
| Price | Required, min 0.01, max 2 decimal places |
| Initial stock qty | Required on create only, min 0 |
| Image URL | Optional, valid URL format |
| Active status | Toggle, default true |

#### Stock Adjustment Form
| Field | Validation |
|---|---|
| Adjustment type | Required — Add / Deduct / Set Exact |
| Quantity | Required, min 1 |
| Note / Reason | Required, min 5 chars |

#### New Internal Request Form
| Field | Validation |
|---|---|
| Project | Required — from active projects list |
| Notes | Optional, max 500 chars |
| Items (dynamic) | Min 1 item required |
| — Product | Required per item, no duplicates |
| — Quantity | Required, min 1, max ≤ availableQuantity |

#### Approve / Reject Request Form
| Field | Validation |
|---|---|
| Comment | Optional on approve, required on reject (min 10 chars) |

#### Change Password Form
| Field | Validation |
|---|---|
| Current password | Required |
| New password | Required, min 8 chars |
| Confirm new password | Required, must match new password |

---

## 10. Non-Functional Requirements

### 10.1 Performance Targets

| Metric | Target |
|---|---|
| Initial app load | < 2 seconds |
| Route transition | < 300ms (TanStack Query cache) |
| API response display | < 500ms perceived (skeleton loaders) |
| SSE notification delivery | < 1 second |
| Initial bundle size | < 150KB gzipped |

### 10.2 Code Splitting Rules

| Rule | Detail |
|---|---|
| Route-level splitting | Every page lazy-loaded via React.lazy() |
| Role bundles isolated | Admin, SK, Employee in separate chunks |
| Icon imports | Individual Lucide imports only — no full set |

### 10.3 Loading States

| State | Behavior |
|---|---|
| Page data loading | Skeleton loaders matching content layout |
| Table loading | 5 placeholder row skeletons |
| Form submitting | Button disabled + spinner |
| Mutation pending | Toast "Processing..." auto-dismissed |

### 10.4 Error Handling

| Error | User Feedback | Recovery |
|---|---|---|
| Network failure | Toast: "Connection error. Try again." | Retry button |
| 401 Unauthorized | Auto logout + redirect to login | Re-login |
| 403 Forbidden | Toast: "You don't have permission" | Stay on page |
| 404 Not Found | Inline empty state | Back navigation |
| 422 Validation | Field-level inline errors | Fix and resubmit |
| 500 Server error | Toast: "Something went wrong" | Retry |
| Stock conflict | Inline warning on request form | Adjust quantity |

### 10.5 Accessibility Standards

| Standard | Implementation |
|---|---|
| ARIA labels | All interactive elements via Radix UI primitives |
| Keyboard navigation | Full tab order on all forms, dialogs, tables |
| Focus management | Dialog focus trapped, restored on close |
| Color contrast | WCAG AA minimum |
| Form errors | Announced via aria-live regions |
| Modal close | Escape key closes all dialogs |

### 10.6 Mobile Responsiveness

| Breakpoint | Layout |
|---|---|
| Desktop ≥ 1024px | Full sidebar + content |
| Tablet 768–1023px | Collapsible sidebar |
| Mobile < 768px | Hamburger menu, stacked layout |

| Screen | Mobile Priority |
|---|---|
| Employee New Request | High — large tap targets, step-by-step builder |
| Store Keeper Requests | High — card layout on mobile |
| Admin Dashboard | Medium — stats stack vertically |
| Admin Audit Log | Low — desktop-first, horizontal scroll |

### 10.7 Security Standards

| Requirement | Implementation |
|---|---|
| JWT storage | httpOnly cookie only — never localStorage |
| CSRF protection | SameSite=Strict cookie policy |
| Role enforcement | Server validates every request — client guards are UX only |
| API base URL | Environment variable, never hardcoded |
| Input sanitization | Zod validation before every API call |
| XSS prevention | React default JSX escaping only |

### 10.8 Browser Support

| Browser | Support |
|---|---|
| Chrome, Firefox, Safari, Edge (last 2 versions) | Full |
| Mobile Chrome / Safari | Full |
| Internet Explorer | Not supported |

### 10.9 State Management Rules

| State Type | Managed By |
|---|---|
| Server data | TanStack Query |
| Current user + role | Zustand (persisted) |
| Notifications queue | Zustand |
| Form state | React Hook Form (local) |
| UI state (modals, drawers) | React useState (local) |

### 10.10 Environment Variables

| Variable | Purpose |
|---|---|
| VITE_API_BASE_URL | Backend API base URL |
| VITE_APP_NAME | App display name in browser tab |
| VITE_APP_ENV | development / production |

---

## 11. Draft Features

| # | Feature | Status | Notes |
|---|---|---|---|
| 1 | WooCommerce Product Sync | 🟡 Draft | Webhook + REST API pull designed. Awaiting confirmation to include. |

---

## 12. Acceptance Criteria (Frontend MVP Done When)

- [ ] All 18 screens render correctly for their respective roles
- [ ] Role-based route guards prevent unauthorized access on all routes
- [ ] Login flow works end-to-end with JWT cookie and Zustand persistence
- [ ] Employee can submit a request, see live stock, and track status
- [ ] Store Keeper receives SSE notification on new request without page refresh
- [ ] Store Keeper can approve, reject, confirm pickup, and complete a request
- [ ] Admin can manage users, products, categories, and projects
- [ ] All forms validate correctly with inline field-level error messages
- [ ] Stock numbers update immediately after approval and pickup actions
- [ ] App loads in under 2 seconds on desktop and mobile
- [ ] All screens are responsive and usable on mobile devices
- [ ] No role can access another role's routes
- [ ] Audit log displays all system actions with actor and timestamp

---

*Verde Support App — Frontend Technical PRD v1.0*
*Prepared as part of product discussion — ready for development handoff after client sign-off.*
