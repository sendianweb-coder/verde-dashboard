# Verde Interface System

## Direction

Verde is a calm internal ERP for operations staff managing products, stock, projects, users, and request approvals. Interfaces should feel like an orderly stockroom desk: bright, quiet, precise, and action-oriented. The work is operational, not decorative. Every surface should help a user find the next exception, approval, product, or record without visual noise.

## Domain

- Inventory shelves and product bins.
- Stock availability, reserved quantity, and operational exceptions.
- Project records that collect real material demand.
- Request queues moving through approval, pickup, and completion.
- Staff identity, role, and accountability.
- Audit-like dates, counts, SKUs, and tabular operational metadata.

## Color World

- Warehouse white: primary cards and table surfaces.
- Lite gray: page canvas, table header rows, inactive controls, and inset search.
- Verde green: approval, available stock, active state, positive actions, and tiny identity dots.
- Soft amber: pending or low-stock states.
- Soft red: reject, destructive actions, out-of-stock, and critical exceptions.
- Muted graphite: table text, navigation labels, metadata, icons, and borders.

## Signature

Use compact operational record rows: an identity marker at the left of important entities, muted metadata directly under the primary label, soft state badges, tabular dates/numbers, and the smallest possible action affordance. This pattern should make users feel they are scanning controlled inventory records, not browsing generic cards.

## Rejected Defaults

- Default: generic SaaS table with plain text cells. Replacement: rich record cells with icon/avatar, primary label, and compact operational metadata.
- Default: broad colorful dashboard decoration. Replacement: mostly neutral structure with Verde green only where it communicates approval, active state, or availability.
- Default: visible action buttons in every row. Replacement: dropdown row actions by default; use minimal icon buttons only when the workflow benefits from fast repeated action, such as the request queue.
- Default: browser locale dates. Replacement: `MMM d, yyyy` with muted tabular typography.
- Default: one-off table implementations. Replacement: shared `DataTable` shell with page-specific cells, filters, and actions.

## Depth Strategy

Use borders-only and subtle surface color shifts. Do not use heavy shadows for dashboard tables or cards.

- Canvas: soft gray page background.
- Surface: white raised panels and tables.
- Inset controls: soft gray search/input backgrounds.
- Floating surfaces: dropdowns and dialogs above cards with subtle border and tiny shadow only when already provided by the component primitive.
- Borders: low-emphasis, token-based `border-border`; never thick decorative borders.

## Spacing And Shape

- Base grid: 4px.
- Micro gaps: 4px to 8px for icons, row actions, badge dots.
- Control height: 32px for compact row actions, 36px for search/filter controls.
- Card padding: 20px to 24px for dashboard cards; table toolbar padding may be 12px vertical and 16px horizontal.
- Table shell radius: 12px to 14px.
- Control radius: 8px to 10px.
- Avoid large radius on tiny buttons or badges.

## Typography

- Keep the project font stack. Use weight, hierarchy, and tabular numerals for craft rather than introducing new fonts casually.
- Page title: 24px to 28px, 600 to 700.
- Section/table title: 16px to 20px, 500 to 600.
- Table header: 14px, 500, muted.
- Table body primary: 14px, 500, primary text.
- Table metadata: 12px to 14px, muted.
- Table badges: 12px, 500.
- Dates and numbers: tabular numerals, muted secondary text.

## Table System

- Use `src/components/shared/DataTable.tsx` as the default reusable table shell.
- Keep domain-specific filtering, derived data, and cell composition in the page component.
- Table shell should own the rounded card, border, toolbar, search, loading/error/empty states, and pagination.
- Table primitive should remain simple and not create a second card border.
- Pass stable row IDs with `getRowId={(row) => row.id}` when available.
- Use `filters` and `actions` slots for custom toolbar controls.
- Search should be neutral, icon-prefixed, `h-9`, and never use Verde green.
- Filter triggers should be compact outline/secondary buttons with a `Filter` icon and a tiny Verde active dot.
- Filter dropdowns should use labels, separators, checkbox items, and clear filters action.

## Table Cells

- Identity cells combine a 28px to 36px avatar/icon marker, primary text, and muted metadata.
- User/requester cells use initials avatars when no image exists.
- Product cells use a product image thumbnail when available, otherwise a package icon tile.
- Project cells use a quiet project icon tile and muted record metadata.
- Category/role/status values should be soft badges, not plain text.
- Item counts should be compact bordered badges with tabular numerals.
- Dates should display as `Jun 7, 2026` style values using `Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' })`.

## Row Actions

- Default row actions: `MoreHorizontal` dropdown with `View`, `Edit`, and destructive/domain actions.
- Destructive dropdown actions should open controlled `ConfirmDialog`; do not nest dialog triggers inside dropdown menu items.
- If a mutation fails, show `getErrorMessage` toast and rethrow so the dialog remains open.
- Request queue exception: use minimal icon buttons instead of dropdowns because repeated approval/rejection/pickup actions need faster scanning and execution.
- Icon-only action buttons need accessible `aria-label` values.

## Current Table Patterns

- Users: initials avatar, name, email metadata, role badge, active/inactive status badge, joined date, filter dropdown for role/status/date, dropdown actions.
- Products: image or package icon, SKU metadata, category badge, available/total/reserved stock stack, stock status badge, QAR price, category/stock filters, dropdown actions.
- Projects: project icon tile, description metadata, active/inactive badge, created date, status/date filters, dropdown actions.
- Requests: project, item-count badge, status badge, requester avatar after status, submitted date, minimal icon action buttons, controlled confirmation dialogs.

## Iconography

- Use `lucide-react` consistently.
- Icons clarify operational meaning. Avoid icons that only decorate.
- Standalone entity icons should sit in subtle background containers.
- Critical/destructive actions may use red icon text; approval/positive actions may use Verde green.

## Checks Before Handoff

- Squint test: table hierarchy should be legible without harsh borders.
- Signature test: identity marker, muted metadata, soft badge, tabular date/number, compact action affordance should appear in table work.
- Token test: use Verde tokens and existing semantic classes, not random hex values in new components.
- Interaction test: loading, empty, error, disabled, hover, and confirmation failure states should remain functional.
