# 🌿 Verde Support App — Frontend Build Plan

**Version:** 1.0
**Date:** March 19, 2026
**Stack:** React + Vite + TypeScript + Tailwind CSS v4 + shadcn/ui
**Design System:** Verde Design System v1.1
**Approach:** AI-assisted development
**Status:** Ready for development kickoff

---

## References

| Document | Version | Purpose |
|---|---|---|
| Frontend PRD | v1.0 | Screen inventory, hooks, forms, NFRs |
| Design System | v1.1 | Tokens, components, visual patterns |
| Server MVP PRD | v1.2 | API endpoints consumed by frontend |

---

## Overview

The Verde frontend is a **private internal SPA** for three staff roles: Admin, Store Keeper, and Employee. It connects to the Verde REST API and receives live updates via SSE. Total: 18 screens, 40 hooks, 10 forms.

---

## Step 1 — Project Scaffold & Configuration
**Estimated time:** 1 day

### Tasks

| Task | Detail |
|---|---|
| Initialize project | `npm create vite@latest verde-app -- --template react-ts` |
| Install Tailwind CSS v4 | `npm install tailwindcss @tailwindcss/vite` |
| Configure Tailwind | `tailwind.config.ts` with all Verde design tokens |
| Create token file | `src/tokens.css` — full CSS variable set from Design System v1.1 |
| Initialize shadcn/ui | `npx shadcn@latest init` — select Tailwind, TypeScript |
| Add base shadcn components | `button card input table dialog badge select popover dropdown-menu sheet` |
| Install core dependencies | `react-router-dom`, `@tanstack/react-query`, `zustand`, `axios`, `react-hook-form`, `zod`, `@hookform/resolvers`, `sonner`, `lucide-react` |
| Install TanStack Table | `@tanstack/react-table` |
| Set up folder structure | Full structure from Frontend PRD Section 4 |
| Configure environment | `.env` with `VITE_API_BASE_URL`, `VITE_APP_NAME`, `VITE_APP_ENV` |
| Set up path aliases | `@/` → `src/` in `tsconfig.json` + `vite.config.ts` |
| Configure Inter font | Google Fonts import in `index.html` |

### Deliverable
App runs on `localhost:5173`, Tailwind tokens active, shadcn components available, routing mounted.

---

## Step 2 — Design Token Integration
**Estimated time:** 0.5 day

### Tasks

| Task | Detail |
|---|---|
| Apply `tokens.css` | Full CSS variable file from Design System v1.1 |
| Update Tailwind config | All semantic color, radius, shadow, and transition tokens mapped |
| Set body defaults | `bg-[var(--color-page)]`, Inter font, antialiased text |
| Verify dark mode | `.dark` class toggle switches all tokens correctly |
| Create `src/lib/utils.ts` | `cn()` utility from shadcn + custom helpers |
| Create `src/lib/constants.ts` | Nav items per role, status label map, status color map |

### Deliverable
All Verde design tokens usable as Tailwind classes. Light and dark mode verified.

---

## Step 3 — API Client & Type Definitions
**Estimated time:** 0.5 day

### Tasks

| Task | Detail |
|---|---|
| `src/api/client.ts` | Axios instance with `baseURL`, `withCredentials: true`, 401 interceptor |
| Create API files | `auth.api.ts`, `users.api.ts`, `products.api.ts`, `categories.api.ts`, `projects.api.ts`, `requests.api.ts`, `orders.api.ts`, `audit.api.ts` |
| TypeScript types | `user.types.ts`, `product.types.ts`, `request.types.ts`, `order.types.ts`, `common.types.ts` |
| TanStack Query setup | `QueryClient` configured in `main.tsx` with default stale times |
| Zod schemas | `src/lib/validators.ts` — all 10 form schemas |

### Deliverable
API client ready, all types defined, query client mounted, all validators written.

---

## Step 4 — Auth Flow
**Estimated time:** 1 day

### Tasks

| Task | Detail |
|---|---|
| `authStore.ts` | Zustand store — user, role, isAuthenticated, persisted |
| `notificationStore.ts` | Zustand store — notifications queue, unread count, addNotification, clearAll |
| `useAuth.ts` | `useLogin`, `useLogout`, `useMe`, `useChangePassword` hooks |
| `LoginPage.tsx` | Email + password form, React Hook Form + Zod, loading state, error message |
| `ProtectedRoute.tsx` | JWT check + role guard — redirects unauthenticated and wrong-role users |
| `roleRoutes.ts` | Role → default dashboard path map |
| `routes/index.tsx` | Full router with all role-based route groups |
| 401 interceptor | Auto-logout + redirect on expired token |
| Post-login redirect | Restores `state.from` location after login |

### Deliverable
Login works end-to-end. Each role redirects to correct dashboard. Wrong role blocked with redirect. Auto-logout on 401 confirmed.

---

## Step 5 — AppShell & Navigation
**Estimated time:** 1 day

### Tasks

| Task | Detail |
|---|---|
| `AppShell.tsx` | Sidebar + topbar + scrollable main content wrapper |
| `Sidebar.tsx` | Role-aware nav from constants, active state: green icon + gray text, no background fill |
| `Topbar.tsx` | Search bar (left), notification bell + avatar dropdown (right) |
| `PageHeader.tsx` | Title + subtitle + optional right CTA slot |
| `NotificationBell.tsx` | Bell icon with red unread count badge, popover list |
| `NotificationDrawer.tsx` | Notification items with type, message, link, timestamp |
| `useSSE.ts` | SSE connection — ADMIN and STORE_KEEPER only, event handlers, cleanup |
| Responsive sidebar | Tablet: collapsible toggle. Mobile: Sheet drawer + hamburger button |
| User profile dropdown | My Profile, Change Password, Sign Out |

### Deliverable
AppShell renders for all roles. Sidebar navigation works with correct active state. SSE connected for Admin and Store Keeper. Mobile hamburger menu works.

---

## Step 6 — Shared Components Library
**Estimated time:** 1 day

### Tasks

| Component | Description |
|---|---|
| `StatusBadge.tsx` | Soft pill badges — all 8 request statuses + 5 order statuses + 3 role badges, token-based colors |
| `StockIndicator.tsx` | In Stock / Low / Critical / Out of Stock — computed from available/total ratio |
| `DataTable.tsx` | TanStack Table v8 — sort, global filter, pagination, row click, skeleton loading (5 rows), empty state |
| `DataTablePagination.tsx` | Page size selector + Prev/Next + page info |
| `ConfirmDialog.tsx` | Reusable confirmation modal — title, description, confirm label, variant (default/destructive), loading state |
| `EmptyState.tsx` | Icon + title + description + optional CTA button |
| `LoadingSpinner.tsx` | Centered spinner, size variants (sm, md, lg) |
| `PageSkeleton.tsx` | Full page loading skeleton matching stats + table layout |

### Deliverable
All shared components built, tested in light and dark mode, accessible via keyboard.

---

## Step 7 — Employee Screens (4 screens)
**Estimated time:** 2 days

### Screens & Key Work

#### `EmployeeDashboard.tsx`
| Element | Detail |
|---|---|
| Stats row | Total requests this month, pending count, approved count, completed count |
| New Request CTA | Large prominent Primary button — top right |
| Active requests | Cards showing project, item count, status badge, submitted date |
| Recent history | Last 5 completed requests |

**Hooks:** `useMyRequests`

---

#### `NewRequestPage.tsx` *(most complex employee screen)*
| Element | Detail |
|---|---|
| Project selector | Searchable select dropdown — `useProjects` |
| Product search | Search input filters product list — `useProducts` |
| Dynamic item builder | Add product rows, set quantity, remove row, no duplicate products |
| Live stock indicator | `availableQuantity` shown per product row — updates on product select |
| Stock warning | Inline amber banner if requested qty exceeds available |
| Submit disabled | If any item qty exceeds available OR no items added |
| Notes field | Optional textarea |
| Submit button | `useCreateRequest` mutation — success redirects to My Requests |

**Hooks:** `useProjects`, `useProducts`, `useCreateRequest`

---

#### `MyRequestsPage.tsx`
| Element | Detail |
|---|---|
| Tab filter | All / Pending / Approved / Completed |
| Requests list | `DataTable` — project, item count, status badge, date, row click |
| Empty state | "No requests yet" with New Request CTA |

**Hooks:** `useMyRequests`

---

#### `RequestDetailPage.tsx` *(Employee — read only)*
| Element | Detail |
|---|---|
| Request summary | Project badge, notes, submitted date |
| Items list | Product name, requested qty |
| Status badge | Large centered status pill |
| Approval timeline | `ApprovalEvent` list — actor, action, comment, timestamp |
| Cancel button | Visible only when status is `PENDING` — opens ConfirmDialog |

**Hooks:** `useRequest`, `useRequestHistory`

### Deliverable
Employee can submit a request with live stock validation, track all requests by status, view full detail and timeline, cancel a pending request.

---

## Step 8 — Store Keeper Screens (5 screens)
**Estimated time:** 2.5 days

### Screens & Key Work

#### `SKDashboard.tsx`
| Element | Detail |
|---|---|
| Live pending requests | SSE-powered list — updates instantly on new request, no refresh |
| Stats row | Pending approvals, approved today, picked up today |
| Low stock warnings | Products where `availableQty` ≤ 20% of `stockQuantity` |
| Notification bell | Unread SSE event counter in topbar |

**Hooks:** `useRequests`, `useProducts`

---

#### `SKRequestsPage.tsx`
| Element | Detail |
|---|---|
| Tab filter | All / Pending / Approved / Picked Up / Completed / Rejected |
| DataTable | Requester name, project, item count, status badge, time since submission |
| Urgency indicator | Time elapsed shown for PENDING requests (e.g. "2h ago") |
| Row click | Navigate to request detail |

**Hooks:** `useRequests`

---

#### `SKRequestDetailPage.tsx` *(most critical SK screen)*
| Element | Detail |
|---|---|
| Request header | Requester name, project badge, submission date |
| Items list | Product name, requested qty, available qty column, inline stock warning |
| Stock warning banner | Amber — if any item qty exceeds available |
| Action bar | PENDING: Approve + Reject buttons. APPROVED: Confirm Pickup. PICKED_UP: Mark Complete |
| Comment field | Optional on approve, required on reject (min 10 chars), shown in action bar |
| ConfirmDialog | Wraps every action — prevents accidental clicks |
| Approval timeline | All `ApprovalEvent` records — actor, action, comment, timestamp — newest first |

**Hooks:** `useRequest`, `useRequestHistory`, `useApproveRequest`, `useRejectRequest`, `usePickupRequest`, `useCompleteRequest`

---

#### `InventoryPage.tsx`
| Element | Detail |
|---|---|
| Products DataTable | Name, SKU, category badge, stock qty, reserved qty, available qty (StockIndicator), price |
| Search + category filter | Filter bar above table |
| Adjust stock button | Per row — opens `StockAdjustmentModal` |
| Movement history | Row action opens side drawer with `StockMovement` history per product |
| Export button | CSV download of current inventory |

**Hooks:** `useProducts`, `useCategories`, `useAdjustStock`, `useProductMovements`

---

#### `SKOrdersPage.tsx`
| Element | Detail |
|---|---|
| Orders DataTable | Order ID, customer name, item count, total, status badge, date |
| Status filter tabs | Pending / Processing / Shipped / Delivered |
| Update status | Inline action — opens status update modal |

**Hooks:** `useOrders`, `useUpdateOrderStatus`

### Deliverable
Store Keeper can process full request lifecycle (approve → pickup → complete). Inventory adjustable. Live SSE notifications confirmed. Orders manageable.

---

## Step 9 — Admin Screens (8 screens)
**Estimated time:** 3 days

### Screens & Key Work

#### `AdminDashboard.tsx`
| Element | Detail |
|---|---|
| Stats row (4 cards) | Total products, active requests, pending orders, total employees |
| Recent requests | Last 5 internal requests with status badges and links |
| Recent orders | Last 5 customer orders |
| Low stock alert | Products where available qty is critical |
| Activity feed | Last 10 audit log entries |

**Hooks:** `useRequests`, `useOrders`, `useProducts`, `useAuditLog`

---

#### `UsersPage.tsx`
| Element | Detail |
|---|---|
| DataTable | Name, email, role badge, status, created date |
| Filter | By role dropdown, search by name/email |
| Add user button | Opens `CreateUserDialog` |
| Row actions | Edit role, deactivate, view detail |

**Hooks:** `useUsers`, `useCreateUser`, `useUpdateUser`, `useDeactivateUser`

---

#### `UserDetailPage.tsx`
| Element | Detail |
|---|---|
| Profile card | Name, email, role badge, joined date, active status |
| Edit form | Change name, role, active status |
| Activity summary | Total requests submitted (if EMPLOYEE) |

**Hooks:** `useUser`, `useUpdateUser`

---

#### `ProductsPage.tsx`
| Element | Detail |
|---|---|
| DataTable | Name, SKU, category, stock, reserved, available (StockIndicator), price |
| Filter | Category dropdown, search by name/SKU |
| Add product button | Opens `CreateProductDialog` |
| Row actions | Edit, adjust stock, deactivate |

**Hooks:** `useProducts`, `useCategories`, `useCreateProduct`, `useUpdateProduct`, `useDeactivateProduct`

---

#### `ProductDetailPage.tsx`
| Element | Detail |
|---|---|
| Product info card | Name, SKU, price, category, image |
| Stock summary card | Current, reserved, available quantities |
| Stock adjustment form | Manual +/- with required note |
| Movement history table | All `StockMovement` records — type, delta, reference, date |

**Hooks:** `useProduct`, `useAdjustStock`, `useProductMovements`

---

#### `ProjectsPage.tsx`
| Element | Detail |
|---|---|
| DataTable | Name, description, status, created date |
| Add project button | Opens `CreateProjectDialog` |
| Row actions | Edit, deactivate |

**Hooks:** `useProjects`, `useCreateProject`, `useUpdateProject`, `useDeactivateProject`

---

#### `AdminRequestsPage.tsx`
| Element | Detail |
|---|---|
| DataTable | Request ID, requester, project, item count, status badge, date |
| Filter | By status, project dropdown, date range |
| Row click | Navigate to request detail (read-only view for admin) |

**Hooks:** `useRequests`

---

#### `AuditLogPage.tsx`
| Element | Detail |
|---|---|
| DataTable | Actor name + role, action, entity type, entity ID, timestamp |
| Filter bar | Actor filter, entity type filter, date range picker |
| Row expand | Click to see `metadata` JSON snapshot (before/after) |
| Pagination | `?page=&limit=` — server-side |

**Hooks:** `useAuditLog`

### Deliverable
Admin has full visibility and control. All CRUD operations work. Audit log queryable with filters.

---

## Step 10 — Forms Implementation
**Estimated time:** 1 day

All forms use React Hook Form + Zod. Applied across screens built in Steps 7–9.

| Form | Screen | Trigger |
|---|---|---|
| Login | LoginPage | Page load |
| Create / Edit User | UsersPage | Modal |
| Create / Edit Product | ProductsPage | Modal |
| Stock Adjustment | ProductDetail + Inventory | Modal |
| Create / Edit Category | ProductsPage sidebar | Modal |
| Create / Edit Project | ProjectsPage | Modal |
| New Internal Request | NewRequestPage | Dedicated page |
| Approve / Reject | SKRequestDetail | Action bar |
| Change Password | Profile dropdown | Modal |
| Update Order Status | SKOrdersPage | Modal |

### Key Validation Rules Applied
- Stock adjustment deduct: cannot exceed `availableQuantity`
- New request: each item qty ≤ `availableQuantity`, no duplicate products, min 1 item
- Reject: comment required, min 10 characters
- Password change: confirm must match new password
- SKU: auto-uppercased on input

### Deliverable
All 10 forms validate correctly. Inline field errors on blur. Success toasts on completion. Submit disabled during loading.

---

## Step 11 — Frontend Testing & QA
**Estimated time:** 1.5 days

### Functional Testing

| Test | Expected Result |
|---|---|
| Login as each role | Correct dashboard redirect |
| Wrong role accesses restricted route | Redirect to own dashboard |
| Employee submits request | Stock reserved, request appears in SK queue |
| SK sees live notification | SSE event received < 1 second, no refresh needed |
| SK approves request | Status updates, stock reservation holds |
| SK confirms pickup | Stock deducted, movement record visible |
| SK rejects request | Stock released, requester sees REJECTED status |
| Employee cancels PENDING request | Request cancelled, stock released |
| Admin adjusts stock | StockMovement record created, AuditLog entry written |
| Form validation errors | Inline field errors on blur, submit blocked |
| 401 response from API | Auto-logout + redirect to login |

### Performance Testing

| Metric | Target |
|---|---|
| Initial app load | < 2 seconds |
| Route transition (cached) | < 300ms |
| DataTable render (100 rows) | No visible lag |
| Form submission feedback | Instant spinner on submit |

### Responsive Testing

| Breakpoint | Key Checks |
|---|---|
| Mobile < 768px | Hamburger menu opens, Employee and SK screens usable |
| Tablet 768–1023px | Sidebar collapsible, tables readable |
| Desktop ≥ 1024px | Full sidebar, all columns visible |

### Cross-Browser Testing

Chrome, Firefox, Safari, Edge — all flows confirmed.

### Dark Mode Testing

All 18 screens verified in dark mode — no hardcoded colors exposed.

### Deliverable
All flows pass. Performance targets met. Mobile confirmed. Dark mode verified. Bug list resolved.

---

## Step 12 — Build & Deployment
**Estimated time:** 0.5 day

### Tasks

| Task | Detail |
|---|---|
| Production build | `npm run build` — output to `dist/` |
| Set production env vars | `VITE_API_BASE_URL` → live server URL |
| Deploy to Hostinger | Upload `dist/` to Hostinger Node.js app slot |
| Configure domain | Point `app.verde.com` to frontend app |
| Test on production URL | Login, submit request, verify SSE on live server |
| Verify CORS | Backend allows frontend production origin |

### Deliverable
Verde app live on `app.verde.com`. All flows confirmed on production.

---

## Frontend Timeline Summary

| Step | Task | Est. Time |
|---|---|---|
| 1 | Project scaffold & configuration | 1 day |
| 2 | Design token integration | 0.5 day |
| 3 | API client & type definitions | 0.5 day |
| 4 | Auth flow | 1 day |
| 5 | AppShell & navigation | 1 day |
| 6 | Shared components library | 1 day |
| 7 | Employee screens (4) | 2 days |
| 8 | Store Keeper screens (5) | 2.5 days |
| 9 | Admin screens (8) | 3 days |
| 10 | Forms implementation | 1 day |
| 11 | Frontend testing & QA | 1.5 days |
| 12 | Build & deployment | 0.5 day |
| **Total** | | **~15 working days / 3 weeks** |

---

## Screen & Component Inventory

| Type | Count |
|---|---|
| Total screens | 18 |
| Shared components | 8 |
| TanStack Query hooks | 40 |
| Forms | 10 |
| Zod validation schemas | 10 |
| API files | 8 |
| Zustand stores | 2 |

---

## Dependencies Reference

```json
{
  "dependencies": {
    "react": "^18",
    "react-dom": "^18",
    "react-router-dom": "^6",
    "@tanstack/react-query": "^5",
    "@tanstack/react-table": "^8",
    "zustand": "^4",
    "axios": "^1",
    "react-hook-form": "^7",
    "zod": "^3",
    "@hookform/resolvers": "^3",
    "sonner": "^1",
    "lucide-react": "latest",
    "class-variance-authority": "^0.7",
    "clsx": "^2",
    "tailwind-merge": "^2"
  },
  "devDependencies": {
    "vite": "^5",
    "@vitejs/plugin-react": "^4",
    "typescript": "^5",
    "tailwindcss": "^4",
    "@tailwindcss/vite": "^4"
  }
}
```

---

## Acceptance Criteria (Frontend Done When)

- [ ] All 18 screens render correctly for their respective roles
- [ ] Role-based route guards block unauthorized access on all routes
- [ ] Login flow works end-to-end with JWT cookie and Zustand persistence
- [ ] Employee can submit a request, see live stock, and track status
- [ ] Store Keeper receives SSE notification on new request without page refresh
- [ ] Store Keeper can approve, reject, confirm pickup, and complete a request
- [ ] Admin can manage users, products, categories, and projects
- [ ] All 10 forms validate correctly with inline field-level error messages
- [ ] Stock numbers update immediately after approval and pickup actions
- [ ] App loads in under 2 seconds on desktop
- [ ] All screens responsive and usable on mobile
- [ ] Dark mode works on all 18 screens with no hardcoded colors
- [ ] No role can access another role's routes
- [ ] Build output is under 150KB gzipped

---

*Verde Support App — Frontend Build Plan v1.0*
*March 19, 2026 — Ready for Phase 2 development kickoff*
