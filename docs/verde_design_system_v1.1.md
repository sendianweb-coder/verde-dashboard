# Verde Design System

**Version:** 1.1.0
**Stack:** Tailwind CSS v4 + React + TypeScript
**App:** Verde Support App — Internal Operations Dashboard
**Style:** Clean & Corporate — inspired by Outlay dashboard reference
**Status:** Active

---

## Table of Contents

1. [Introduction & Principles](#1-introduction--principles)
2. [Getting Started](#2-getting-started)
3. [Design Tokens](#3-design-tokens)
4. [Foundations](#4-foundations)
5. [UI Components](#5-ui-components)
6. [Patterns](#6-patterns)
7. [Accessibility Guidelines](#7-accessibility-guidelines)
8. [Changelog & Governance](#8-changelog--governance)

---

## 1. Introduction & Principles

The Verde Design System is the single source of truth for all UI decisions in the Verde Support App. It ensures consistency, accessibility, and development speed across every screen — from the Employee request form to the Store Keeper approval dashboard.

### 1.1 Visual Identity

Verde's UI is **clean, minimal, and professional** — inspired by modern SaaS dashboards like Outlay and Linear. Brand green is used sparingly as a functional accent, never decoratively. The UI stays calm and out of the way so staff can focus on inventory decisions.

| Attribute | Direction |
|---|---|
| Background | Pure white content area, light gray page background |
| Sidebar | White, minimal, no heavy shadows |
| Color usage | Green reserved for actions, active states, and positive status only |
| Typography | High weight contrast — bold headings, regular body text |
| Density | Comfortable — not cramped, not spacious |
| Borders | Subtle light gray — `#e5e7eb` — never dark or heavy |

### 1.2 Design Principles

| Principle | Definition |
|---|---|
| **Clarity first** | Every element serves a purpose. No decorative complexity. Staff understand what to do at a glance. |
| **Role awareness** | UI adapts to context. Store Keeper and Employee see different affordances for the same data. |
| **Calm efficiency** | The app handles stressful inventory situations. UI must remain quiet and structured. |
| **Accessible by default** | Every component works for keyboard users and screen readers out of the box. |
| **Token-driven** | All visual decisions reference design tokens. No hardcoded colors or ad-hoc Tailwind classes. |

---

## 2. Getting Started

### 2.1 Installation

```bash
# 1. Install dependencies
npm install

# 2. Install Tailwind CSS v4
npm install tailwindcss @tailwindcss/vite

# 3. Install shadcn/ui CLI
npx shadcn@latest init

# 4. Add components as needed
npx shadcn@latest add button card input table dialog badge select popover dropdown-menu
```

### 2.2 Tailwind v4 CSS Entry Point

```css
/* src/index.css */
@import "tailwindcss";
@import "./tokens.css";

@layer base {
  body {
    background-color: var(--color-page);
    color: var(--color-text-primary);
    font-family: "Inter", system-ui, sans-serif;
    -webkit-font-smoothing: antialiased;
  }
}
```

### 2.3 Contributing Guidelines

- All components must reference tokens only — no raw hex or hardcoded Tailwind color classes
- Every component must include a dark mode variant
- All interactive components must pass WCAG AA contrast ratio
- New tokens added to `tokens.css` first, then referenced in Tailwind config
- Component files follow: `ComponentName.tsx` with shadcn/ui as the base primitive

---

## 3. Design Tokens

### 3.1 Full Token File

```css
/* src/tokens.css */
@layer base {
  :root {
    /* ── Page & Surface ─────────────────────── */
    --color-page:           #f9fafb;   /* outer page background */
    --color-background:     #ffffff;   /* content area, sidebar, topbar */
    --color-surface:        #f9fafb;   /* table row alt, input bg */
    --color-surface-raised: #ffffff;   /* cards, modals, dropdowns */

    /* ── Borders ────────────────────────────── */
    --color-border:         #e5e7eb;   /* default borders */
    --color-border-strong:  #d1d5db;   /* table headers, dividers */

    /* ── Brand Green ────────────────────────── */
    --color-brand-50:       #f0fdf4;
    --color-brand-100:      #dcfce7;
    --color-brand-500:      #22c55e;
    --color-brand-600:      #16a34a;   /* primary button, active icon */
    --color-brand-700:      #15803d;   /* button hover, pressed */

    /* ── Text ───────────────────────────────── */
    --color-text-primary:   #111827;   /* headings, body content */
    --color-text-secondary: #6b7280;   /* labels, nav text, captions */
    --color-text-muted:     #9ca3af;   /* placeholders, disabled */
    --color-text-inverse:   #ffffff;   /* text on dark backgrounds */

    /* ── Sidebar ────────────────────────────── */
    --color-sidebar-bg:         #ffffff;
    --color-sidebar-border:     #e5e7eb;
    --color-nav-default-text:   #6b7280;   /* inactive nav item text */
    --color-nav-default-icon:   #9ca3af;   /* inactive nav item icon */
    --color-nav-active-icon:    #16a34a;   /* active nav item icon — brand green */
    --color-nav-active-text:    #6b7280;   /* active nav item text — stays gray */

    /* ── Stat Card Icons ────────────────────── */
    --color-stat-icon-bg:   #f3f4f6;   /* neutral gray circle bg */
    --color-stat-icon:      #6b7280;   /* neutral gray icon */

    /* ── Status Badge Colors ────────────────── */
    --badge-pending-bg:     #fef9c3;
    --badge-pending-text:   #854d0e;
    --badge-approved-bg:    #dbeafe;
    --badge-approved-text:  #1e40af;
    --badge-rejected-bg:    #fee2e2;
    --badge-rejected-text:  #991b1b;
    --badge-picked-up-bg:   #ede9fe;
    --badge-picked-up-text: #5b21b6;
    --badge-completed-bg:   #dcfce7;
    --badge-completed-text: #166534;
    --badge-processing-bg:  #dbeafe;
    --badge-processing-text:#1e40af;
    --badge-shipped-bg:     #e0e7ff;
    --badge-shipped-text:   #3730a3;
    --badge-cancelled-bg:   #fee2e2;
    --badge-cancelled-text: #991b1b;

    /* ── Status Semantic ────────────────────── */
    --color-success:        #16a34a;
    --color-warning:        #d97706;
    --color-error:          #dc2626;
    --color-info:           #2563eb;

    /* ── Radius ─────────────────────────────── */
    --radius-sm:   0.25rem;   /* 4px  */
    --radius-md:   0.375rem;  /* 6px  */
    --radius-lg:   0.5rem;    /* 8px  */
    --radius-xl:   0.75rem;   /* 12px */
    --radius-2xl:  1rem;      /* 16px */
    --radius-full: 9999px;    /* pill */

    /* ── Shadow ─────────────────────────────── */
    --shadow-sm:  0 1px 2px 0 rgb(0 0 0 / 0.05);
    --shadow-md:  0 4px 6px -1px rgb(0 0 0 / 0.07), 0 2px 4px -2px rgb(0 0 0 / 0.05);
    --shadow-lg:  0 10px 15px -3px rgb(0 0 0 / 0.08), 0 4px 6px -4px rgb(0 0 0 / 0.05);

    /* ── Transition ─────────────────────────── */
    --transition-fast:   150ms ease;
    --transition-normal: 200ms ease;
    --transition-slow:   300ms ease;
  }

  .dark {
    --color-page:           #0f172a;
    --color-background:     #1e293b;
    --color-surface:        #1e293b;
    --color-surface-raised: #334155;
    --color-border:         #334155;
    --color-border-strong:  #475569;

    --color-sidebar-bg:         #1e293b;
    --color-sidebar-border:     #334155;
    --color-nav-default-text:   #94a3b8;
    --color-nav-default-icon:   #64748b;
    --color-nav-active-icon:    #22c55e;
    --color-nav-active-text:    #94a3b8;

    --color-stat-icon-bg:   #334155;
    --color-stat-icon:      #94a3b8;

    --color-text-primary:   #f8fafc;
    --color-text-secondary: #94a3b8;
    --color-text-muted:     #64748b;

    --badge-pending-bg:     #422006;
    --badge-pending-text:   #fde68a;
    --badge-approved-bg:    #1e3a5f;
    --badge-approved-text:  #93c5fd;
    --badge-rejected-bg:    #450a0a;
    --badge-rejected-text:  #fca5a5;
    --badge-picked-up-bg:   #2e1065;
    --badge-picked-up-text: #c4b5fd;
    --badge-completed-bg:   #052e16;
    --badge-completed-text: #86efac;
  }
}
```

### 3.2 Token Reference Table

| Token | Light | Dark | Usage |
|---|---|---|---|
| `--color-page` | #f9fafb | #0f172a | Outermost page background |
| `--color-background` | #ffffff | #1e293b | Sidebar, topbar, content areas |
| `--color-surface-raised` | #ffffff | #334155 | Cards, modals, dropdowns |
| `--color-border` | #e5e7eb | #334155 | All default borders |
| `--color-text-primary` | #111827 | #f8fafc | Headings and body content |
| `--color-text-secondary` | #6b7280 | #94a3b8 | Labels, nav text, captions |
| `--color-brand-600` | #16a34a | #16a34a | Primary button, active nav icon |
| `--color-nav-active-icon` | #16a34a | #22c55e | Active sidebar icon only |
| `--color-nav-active-text` | #6b7280 | #94a3b8 | Active sidebar text — stays gray |
| `--color-stat-icon-bg` | #f3f4f6 | #334155 | Stat card icon container |
| `--color-stat-icon` | #6b7280 | #94a3b8 | Stat card icon color |

---

## 4. Foundations

### 4.1 Color Palette

#### Brand Green

| Swatch | Hex | Usage |
|---|---|---|
| Brand 50 | #f0fdf4 | Badge backgrounds, subtle highlights |
| Brand 100 | #dcfce7 | Completed badge background |
| Brand 500 | #22c55e | Active nav icon (dark mode) |
| Brand 600 | #16a34a | Primary button fill, active nav icon (light) |
| Brand 700 | #15803d | Primary button hover state |

#### Neutral Grays (Core UI)

| Swatch | Hex | Usage |
|---|---|---|
| Gray 50 | #f9fafb | Page background, surface |
| Gray 100 | #f3f4f6 | Stat icon container bg |
| Gray 200 | #e5e7eb | Borders, dividers |
| Gray 300 | #d1d5db | Strong borders, table headers |
| Gray 500 | #6b7280 | Secondary text, inactive nav text |
| Gray 400 | #9ca3af | Muted text, placeholders, inactive icons |
| Gray 900 | #111827 | Primary headings and body text |

#### Status Colors

| Status | Hex | Badge BG | Badge Text | Usage |
|---|---|---|---|---|
| Success | #16a34a | #dcfce7 | #166534 | Completed, in-stock |
| Warning | #d97706 | #fef9c3 | #854d0e | Pending, low stock |
| Error | #dc2626 | #fee2e2 | #991b1b | Rejected, out of stock |
| Info | #2563eb | #dbeafe | #1e40af | Approved, informational |
| Purple | #7c3aed | #ede9fe | #5b21b6 | Picked up status |

### 4.2 Typography Scale

**Font:** Inter (primary), JetBrains Mono (SKU codes, IDs)

| Name | Size | Weight | Usage |
|---|---|---|---|
| `h1` | 30px / 1.875rem | 700 | Page titles |
| `h2` | 24px / 1.5rem | 600 | Section headings |
| `h3` | 20px / 1.25rem | 600 | Card titles, dialog headers |
| `h4` | 18px / 1.125rem | 600 | Sub-section labels |
| `body-lg` | 16px / 1rem | 400 | Default body text |
| `body` | 14px / 0.875rem | 400 | Table content, form labels |
| `body-sm` | 13px / 0.8125rem | 400 | Captions, helper text |
| `caption` | 12px / 0.75rem | 400 | Timestamps, version labels |
| `mono` | 14px / 0.875rem | 400 | SKU, IDs, codes |

### 4.3 Spacing Scale

Verde uses Tailwind's default 4px base grid.

| Token | px | Usage |
|---|---|---|
| `space-1` | 4px | Icon-to-text gap |
| `space-2` | 8px | Inline element spacing |
| `space-3` | 12px | Button vertical padding |
| `space-4` | 16px | Card inner padding, form field gap |
| `space-5` | 20px | Section header bottom margin |
| `space-6` | 24px | Card padding standard |
| `space-8` | 32px | Section separation |
| `space-12` | 48px | Major layout divisions |
| `space-16` | 64px | Page top padding |

### 4.4 Icons

**Library:** Lucide React — individual named imports only. Never import the full set.

| Category | Icons |
|---|---|
| Navigation | `LayoutDashboard` `Users` `Package` `FolderKanban` `ClipboardList` `ShoppingCart` `ScrollText` |
| Actions | `Plus` `PlusCircle` `Pencil` `Trash2` `Check` `X` `ChevronDown` `ChevronRight` `MoreHorizontal` |
| Status | `CheckCircle2` `XCircle` `AlertTriangle` `Info` `Clock` `Circle` |
| Stock | `TrendingDown` `TrendingUp` `AlertCircle` `PackageOpen` |
| UI | `Bell` `Search` `Filter` `Download` `LogOut` `Settings` `Menu` `Eye` |

**Active nav icon rule:** Active sidebar icon uses `text-brand-600` — all other icons use `text-text-muted`.

---

## 5. UI Components

---

### 5.1 Button

**Description:** Primary interactive element. Used for form submissions, workflow actions, and navigation triggers.

#### Variants

| Variant | Key Classes | Usage |
|---|---|---|
| Primary | `bg-brand-600 text-white hover:bg-brand-700 rounded-lg shadow-sm` | Single primary CTA per section |
| Secondary | `bg-background border border-border text-text-primary hover:bg-surface rounded-lg` | Secondary alongside primary |
| Ghost | `text-text-secondary hover:bg-surface hover:text-text-primary rounded-lg` | Sidebar nav, icon-only, tertiary |
| Destructive | `bg-error text-white hover:bg-red-700 rounded-lg` | Delete, deactivate, reject |
| Outline | `border border-brand-600 text-brand-600 hover:bg-brand-50 rounded-lg` | Emphasis without solid fill |

#### Sizes

| Size | Classes | Usage |
|---|---|---|
| `sm` | `h-8 px-3 text-xs rounded-md` | Inline table row actions |
| `md` | `h-9 px-4 text-sm rounded-lg` | Standard form and card buttons |
| `lg` | `h-11 px-6 text-base rounded-lg` | Page-level CTAs (e.g. "+ Add New Project") |
| `icon` | `h-9 w-9 p-0 rounded-lg` | Bell, search, settings icon buttons |

#### States

| State | Behavior |
|---|---|
| Default | Base variant classes |
| Hover | Darker background — `transition-colors duration-[150ms]` |
| Focus | `focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2` |
| Disabled | `opacity-50 cursor-not-allowed pointer-events-none` |
| Loading | Spinner before label, button disabled, `aria-busy="true"` |

#### Do's and Don'ts

- ✅ Use Primary for the single most important action on a screen — exactly like the "+ Add New Project" button in the reference
- ✅ Wrap destructive actions in `ConfirmDialog` before triggering
- ✅ Always include `aria-label` for icon-only buttons
- ❌ Never place two Primary buttons side by side
- ❌ Never use raw Tailwind color classes — always token-based

---

### 5.2 Card

**Description:** Primary container for grouped content — stat cards, product details, request summaries.

#### Variants

| Variant | Classes | Usage |
|---|---|---|
| Default | `bg-surface-raised border border-border rounded-xl shadow-sm` | Standard content container |
| Flat | `bg-surface rounded-xl` | Nested sections, inner containers |
| Interactive | `...default + hover:shadow-md transition-shadow duration-[200ms] cursor-pointer` | Clickable cards |
| Stat | `...default + flex flex-col gap-2 p-6` | Dashboard KPI cards |

#### Stat Card Anatomy (matches reference style)

| Part | Classes | Detail |
|---|---|---|
| Icon container | `w-10 h-10 rounded-full bg-[var(--color-stat-icon-bg)] flex items-center justify-center` | Neutral gray circle |
| Icon | `w-5 h-5 text-[var(--color-stat-icon)]` | Neutral gray Lucide icon |
| Value | `text-3xl font-bold text-text-primary mt-2` | Large bold number |
| Label | `text-body-sm text-text-secondary` | Descriptive label below value |

#### Do's and Don'ts

- ✅ Use stat card pattern for all dashboard KPI numbers — gray icon, bold value, gray label
- ✅ Keep card padding consistent at `p-6`
- ❌ Never nest cards more than one level deep
- ❌ Never add colored icon backgrounds to stat cards — neutral gray only

---

### 5.3 Input

**Description:** Text entry for all forms — login, product creation, request builder.

#### Variants

| Variant | Key Classes | Usage |
|---|---|---|
| Default | `border border-border rounded-lg bg-background px-3 py-2 text-body text-text-primary placeholder:text-text-muted focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none` | All standard text inputs |
| Error | `...default — border-error focus:ring-error` | After Zod validation failure |
| Disabled | `...default + opacity-50 cursor-not-allowed bg-surface` | Read-only fields |
| With icon | `pl-9` on input + icon `absolute left-3 text-text-muted` | Search inputs |

#### Anatomy

| Part | Element | Classes |
|---|---|---|
| Label | `label` | `text-body font-medium text-text-primary mb-1.5 block` |
| Input | `input` | See variants above |
| Helper text | `p` | `text-body-sm text-text-secondary mt-1` |
| Error message | `p` | `text-body-sm text-error mt-1` + `role="alert"` |

#### Do's and Don'ts

- ✅ Always show a visible label above every input field
- ✅ Show error immediately on field blur — not only on submit
- ❌ Never use placeholder text as the only label
- ❌ Never show more than one error per field — show the most critical

---

### 5.4 Table (DataTable)

**Description:** Primary data display. Built on TanStack Table v8 + shadcn/ui Table. Matches the clean reference table style.

#### Visual Style

| Element | Classes |
|---|---|
| Table wrapper | `w-full border border-border rounded-xl overflow-hidden` |
| Header row | `bg-surface border-b border-border-strong` |
| Header cell | `text-body-sm font-medium text-text-secondary px-4 py-3 text-left` |
| Body row | `border-b border-border hover:bg-surface transition-colors duration-[150ms]` |
| Body cell | `text-body text-text-primary px-4 py-3` |
| Numeric cell | `text-body tabular-nums text-right text-text-primary` |
| Action cell | `flex items-center justify-end gap-1` |

#### Features

| Feature | Detail |
|---|---|
| Global search | Input above table — filters all columns |
| Column sorting | Click header — shows `↑` `↓` indicator |
| Pagination | Page size selector + Prev/Next — bottom of table |
| Row click | Full row clickable when `onRowClick` prop provided |
| Loading | 5 animated skeleton rows |
| Empty | `EmptyState` component replaces body |

#### Filter Bar Pattern (matches reference)

Sits between page header and table:
`flex items-center gap-3` containing search input + filter pills + date selector + export button

#### Do's and Don'ts

- ✅ Always handle empty state — never an empty table body
- ✅ Right-align all numeric and action columns
- ✅ Use `StatusBadge` in status columns — never colored text alone
- ❌ Never put more than 3 actions per row — use `MoreHorizontal` dropdown
- ❌ Never use raw `<table>` — always the shared `DataTable` component

---

### 5.5 Sidebar

**Description:** Primary navigation. White background, minimal, role-aware. Active state: **green icon + gray text, no background fill**.

#### Structure

| Part | Element | Classes |
|---|---|---|
| Root | `nav` | `flex flex-col h-full w-64 bg-[var(--color-sidebar-bg)] border-r border-[var(--color-sidebar-border)]` |
| Logo area | `div` | `flex items-center gap-2 px-6 py-5 border-b border-border` |
| Section label | `p` | `px-4 pt-4 pb-1 text-caption font-medium text-text-muted uppercase tracking-wider` |
| Nav list | `ul` | `flex flex-col gap-0.5 px-3 py-2` |
| User footer | `div` | `mt-auto px-4 py-4 border-t border-border` |

#### Nav Item States

| State | Icon Class | Text Class | Background |
|---|---|---|---|
| Default | `text-[var(--color-nav-default-icon)]` | `text-[var(--color-nav-default-text)]` | None |
| Hover | `text-text-primary` | `text-text-primary` | `hover:bg-surface rounded-lg` |
| **Active** | **`text-[var(--color-nav-active-icon)]`** — brand green | **`text-[var(--color-nav-active-text)]`** — stays gray | **None — no background** |
| Disabled | All muted | All muted | `opacity-40 pointer-events-none` |

**Active nav item base classes:**
`flex items-center gap-3 px-3 py-2.5 rounded-lg text-body transition-colors duration-[150ms]`

#### Responsive Behavior

| Breakpoint | Behavior |
|---|---|
| Desktop ≥ 1024px | Fixed left, always visible |
| Tablet 768–1023px | Collapsible via topbar toggle |
| Mobile < 768px | Sheet overlay via hamburger icon |

#### Do's and Don'ts

- ✅ Active icon turns brand green — this is the **only** green element on the sidebar
- ✅ Section labels ("Menu", "Tools") use uppercase caption style like the reference
- ❌ Never add background color to active nav items
- ❌ Never add more than 8 nav items per role

---

### 5.6 Navbar (Topbar)

**Description:** Horizontal top bar on all authenticated screens. White background, minimal.

#### Structure

| Part | Classes | Content |
|---|---|---|
| Root | `h-16 flex items-center justify-between px-6 bg-background border-b border-border` | Full-width white bar |
| Left | `flex items-center gap-3` | Search bar (center-left like reference) |
| Right | `flex items-center gap-3` | Notification bell + avatar + name |

#### Search Bar (matches reference)

`flex items-center gap-2 h-9 px-3 rounded-lg border border-border bg-surface text-body text-text-muted w-64`
Contains: search icon + "Search..." placeholder text

#### Right Section

| Component | Classes | Detail |
|---|---|---|
| Notification bell | Ghost icon button | `NotificationBell` with red unread badge |
| Avatar | `w-8 h-8 rounded-full` | User photo or initials fallback |
| User name | `text-body font-medium text-text-primary` | Name + dropdown chevron |

#### Do's and Don'ts

- ✅ Keep topbar white — matches sidebar and content area for seamless feel
- ✅ Search bar sits left, user controls sit right — exactly like reference
- ❌ Never use a dark or colored topbar — keep it white/light
- ❌ Never add more than 4 elements to the right section

---

### 5.7 Modal (Dialog)

**Description:** Overlay dialog for focused tasks — create/edit forms, confirmations, detail views.

#### Variants

| Variant | Max Width | Usage |
|---|---|---|
| Compact | `max-w-sm` | Confirmation dialogs |
| Default | `max-w-lg` | Standard create/edit forms |
| Wide | `max-w-2xl` | Complex multi-field forms |
| Full | `max-w-4xl` | Detail views with embedded tables |

#### Structure

| Part | Classes |
|---|---|
| Overlay | `fixed inset-0 bg-black/40 backdrop-blur-[2px] z-50` |
| Panel | `bg-surface-raised rounded-2xl shadow-lg border border-border p-6 w-full` |
| Header | `flex items-center justify-between mb-1` |
| Title | `text-h3 font-semibold text-text-primary` |
| Description | `text-body text-text-secondary mt-1` |
| Content | `py-4` |
| Footer | `flex items-center justify-end gap-2 mt-6 pt-4 border-t border-border` |

#### Animation

| Direction | Transform |
|---|---|
| Enter | `opacity-0 scale-95` → `opacity-100 scale-100`, `duration-[200ms] ease-out` |
| Exit | `opacity-100 scale-100` → `opacity-0 scale-95`, `duration-[150ms] ease-in` |

#### Do's and Don'ts

- ✅ Footer: Cancel (ghost/outline) left, Primary action right
- ✅ Always include visible close button AND escape key dismissal
- ❌ Never stack two modals
- ❌ Never put navigation links inside a modal

---

### 5.8 StatusBadge

**Description:** Soft pill badge for request and order statuses. Light colored background + matching darker text.

#### Base Classes

`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium`

#### Status Variants

| Status | Background Token | Text Token |
|---|---|---|
| PENDING | `--badge-pending-bg` | `--badge-pending-text` |
| APPROVED | `--badge-approved-bg` | `--badge-approved-text` |
| REJECTED | `--badge-rejected-bg` | `--badge-rejected-text` |
| PICKED_UP | `--badge-picked-up-bg` | `--badge-picked-up-text` |
| COMPLETED | `--badge-completed-bg` | `--badge-completed-text` |
| PROCESSING | `--badge-processing-bg` | `--badge-processing-text` |
| SHIPPED | `--badge-shipped-bg` | `--badge-shipped-text` |
| CANCELLED | `--badge-cancelled-bg` | `--badge-cancelled-text` |

#### Role Badge Variants

| Role | Background | Text |
|---|---|---|
| ADMIN | `--color-brand-100` | `--color-brand-700` |
| STORE_KEEPER | `#ede9fe` | `#5b21b6` |
| EMPLOYEE | `#f3f4f6` | `#374151` |

#### Do's and Don'ts

- ✅ Always include text label — never color alone
- ✅ Use token-based colors — never hardcoded Tailwind status classes
- ❌ Never use StatusBadge for non-status content

---

## 6. Patterns

### 6.1 Dashboard Layout Pattern

Every dashboard page follows this exact structure:

```
PageHeader
  ├── Left: Page title (h1) + subtitle (text-secondary)
  └── Right: Primary action button (e.g. "+ Add New Project")

Stats Row
  └── grid grid-cols-2 gap-4 lg:grid-cols-4
      └── 2–4 Stat Cards (gray icon circle + bold number + gray label)

Filter Bar (for pages with tables)
  └── flex items-center gap-3
      ├── Search input (w-64)
      ├── Filter pill buttons
      └── Export / date controls (right-aligned)

Main DataTable or Content
  └── Full width, border rounded-xl, clean rows

Secondary Content (optional)
  └── Recent activity, low stock alerts
```

### 6.2 Page Header Pattern

Matches reference exactly:

| Part | Classes |
|---|---|
| Container | `flex items-center justify-between mb-6` |
| Left — title | `text-h1 font-bold text-text-primary` |
| Left — subtitle | `text-body text-text-secondary mt-0.5` |
| Right — CTA | Primary button `lg` size |

### 6.3 Form Pattern

```
Form title (if standalone page)

Field groups (stacked, gap-4):
  label → input → helper/error

Section divider (for multi-section forms):
  border-t border-border my-6

Footer:
  flex items-center justify-end gap-2
  Cancel (ghost) | Submit (primary)
```

### 6.4 Empty State Pattern

| Part | Classes | Content |
|---|---|---|
| Container | `flex flex-col items-center justify-center py-16 text-center` | Center in content |
| Icon | `w-12 h-12 text-text-muted mb-4` | Context-relevant Lucide icon |
| Title | `text-h4 font-semibold text-text-primary mb-2` | "No requests yet" |
| Description | `text-body text-text-secondary max-w-sm` | Helpful next step hint |
| CTA | Primary or ghost button | Optional |

### 6.5 Request Approval Workflow Pattern

```
Request header (requester name, project badge, submitted date)
    ↓
Items list (product name | requested qty | available qty | inline warning)
    ↓
Stock warning banner (amber — if qty exceeds available)
    ↓
Action bar (sticky bottom on mobile):
  PENDING  → [Approve] [Reject with reason]
  APPROVED → [Confirm Pickup]
  PICKED_UP→ [Mark Complete]
    ↓
Comment field (required on reject, optional on approve)
    ↓
ConfirmDialog before any action
    ↓
Approval Timeline (ApprovalEvent list — newest first)
```

### 6.6 Notification Toast Pattern

**Library:** Sonner

| Type | Trigger | Duration |
|---|---|---|
| Success | `onSuccess` | 3 seconds |
| Error | `onError` | 5 seconds |
| Info | SSE event | 4 seconds |
| Loading | `isPending` | Until resolved |

Position: bottom-right desktop, bottom-center mobile.

---

## 7. Accessibility Guidelines

### 7.1 Contrast Standards

| Context | Minimum Ratio | Standard |
|---|---|---|
| Body text (< 18px) | 4.5:1 | WCAG AA |
| Large text (≥ 18px bold) | 3:1 | WCAG AA |
| Interactive elements | 3:1 against background | WCAG AA |
| Status badges | Text + bg must meet 4.5:1 | WCAG AA |

### 7.2 Keyboard Navigation

| Rule | Detail |
|---|---|
| All interactive elements | Reachable via Tab key |
| Focus order | Matches visual top-to-bottom, left-to-right |
| Focus ring | Always visible — `focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2` |
| Dialog | Focus trapped inside while open |
| Escape key | Closes all modals, dropdowns, drawers |

### 7.3 Screen Reader Requirements

| Element | Requirement |
|---|---|
| Icon-only buttons | `aria-label` with descriptive text |
| Status badges | Text label always present — no color-only status |
| Form errors | `role="alert"` on error messages |
| Loading states | `aria-busy="true"` on loading containers |
| Tables | `aria-label` on all DataTable instances |
| SSE notifications | Delivered in `aria-live="polite"` region |
| Active nav item | `aria-current="page"` |

### 7.4 Reduced Motion

All transitions wrapped in `motion-safe:` Tailwind variant or `@media (prefers-reduced-motion: reduce)` — duration reduced to `0.01ms` for users who prefer no animation.

### 7.5 Component Shipping Checklist

- [ ] Keyboard navigable and focusable
- [ ] Focus ring visible in all interactive states
- [ ] WCAG AA contrast in light and dark mode
- [ ] `aria-label` on all icon-only buttons
- [ ] Error states announced to screen readers
- [ ] No information conveyed by color alone
- [ ] Works at 200% browser zoom
- [ ] Tested on VoiceOver (macOS) or NVDA (Windows)

---

## 8. Changelog & Governance

### 8.1 Version History

| Version | Date | Changes |
|---|---|---|
| 1.0.0 | March 19, 2026 | Initial design system — Verde MVP |
| 1.1.0 | March 19, 2026 | Visual taste update — Clean & Corporate style, Outlay-inspired reference, gray stat icons, soft pill badges, green icon-only active nav state, full token update |

### 8.2 Contribution Process

1. **Propose** — Open a discussion with new component or token need
2. **Design** — Tailwind prototype showing light + dark variants
3. **Review** — Token compliance + accessibility check by one team member
4. **Document** — Add full component docs following Section 5 format
5. **Merge** — Added to `src/components/ui/` or `src/components/shared/`

### 8.3 Token Change Policy

- Semantic token renames require deprecation notice in next minor version
- No raw color values accepted in component PRs — token reference required
- Dark mode must be tested for every token change

### 8.4 Governance

| Role | Responsibility |
|---|---|
| Design System Owner | Approves new tokens, breaking changes, major version bumps |
| Developer | Proposes and implements components |
| Reviewer | Checks accessibility, token compliance, dark mode |

### 8.5 Semantic Versioning

| Change Type | Version Bump |
|---|---|
| New component or token | Minor (1.x.0) |
| Bug fix, accessibility fix | Patch (1.0.x) |
| Token rename or removal | Major (x.0.0) |
| Breaking component API | Major (x.0.0) |

---

*Verde Design System v1.1.0*
*Clean & Corporate — Outlay-inspired*
*Internal use only — Verde Support App*
