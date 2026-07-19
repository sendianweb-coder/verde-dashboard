# Agent Instructions

## Package Manager
- Use **npm** from this directory: `npm install`, `npm run dev`, `npm run lint`, `npm run build`, `npm run preview`.
- `package.json` has no `test` script; do not claim tests passed unless a test runner is added and run.

## Commit Attribution
AI commits MUST include:
```
Co-Authored-By: (the agent model's name and attribution byline)
```
Example: `Co-Authored-By: GPT-5.5 <noreply@example.com>`

## File-Scoped Commands
| Task | Command |
|------|---------|
| Lint file | `npx eslint path/to/file.tsx` |
| Typecheck project | `npx tsc -b` |
| Build | `npm run build` |

## Required Verification
- For code changes, run `npm run lint && npm run build` before handoff.
- If verification cannot run, state the blocker and residual risk.

## Project Map
- Stack: React 19, TypeScript 5, Vite 8, Tailwind 4.
- API: Axios client in `src/api/client.ts`; domain API modules in `src/api`.
- State: TanStack Query for server state; Zustand for auth/session state.
- Routing: role-gated routes in `src/routes/index.tsx`; keep protected screens behind the correct `ProtectedRoute`.
- UI: Radix/shadcn-style primitives in `src/components/ui`; shared app components in `src/components/shared`.
- Validation/types: Zod schemas in `src/lib/validators.ts`; domain types in `src/types`.
- Page-specific utilities: Complex page logic goes in `src/lib/{pageName}/` (e.g., `src/lib/inventoryGrid/` for InventoryGridPage).
- Alias: `@/*` maps to `src/*`.

## Key Conventions
- Follow nearby patterns before adding abstractions; keep route pages thin when hooks/shared components fit.
- Prefer `@/` imports for `src` modules and `import type` for type-only imports.
- Keep backend nullability/optionality intact at the UI boundary.
- Reuse `getErrorMessage` from `src/lib/errors.ts`; do not swallow errors silently.
- Keep query keys stable and invalidate affected list/detail queries after mutations.
- Add shadcn components with `npx shadcn@latest add <component-name>`, not copied source.
- Before creating pages or editing UI components, check `.interface-design/system.md` and `DESIGN.md`; preserve the Verde table/card/action patterns unless the user asks otherwise.

## Organizing Page-Specific Logic
When a page requires custom services, utilities, or complex business logic:

**API Layer** (`src/api/{domain}.api.ts`):
- Create domain-specific API modules (e.g., `inventoryImages.api.ts` for image uploads).
- Export async functions that call `apiClient` and return typed responses.
- Keep API functions pure and focused on HTTP communication.

**Hooks Layer** (`src/hooks/{domain}.ts`):
- Wrap API calls with TanStack Query (`useQuery`, `useMutation`).
- Export query key factories for cache invalidation.
- Handle retry logic, invalidation, and optimistic updates here.

**Page Utilities** (`src/lib/{pageName}/`):
- For complex page-specific logic (e.g., Univer workbook helpers, image validation), create a dedicated subfolder.
- Example: `src/lib/inventoryGrid/workbookHelpers.ts`, `src/lib/inventoryGrid/imageUpload.ts`.
- Keep functions pure, testable, and framework-agnostic.
- Extract constants (e.g., max file size, allowed types) to the top of utility files.

**Types** (`src/types/{domain}.ts`):
- Create domain-specific type modules when existing types don't cover new entities.
- Example: `inventoryImages.ts` for image upload payloads/responses.

**Components** (`src/components/shared/{domain}/`):
- Page-specific reusable components go in domain subfolders.
- Example: `src/components/shared/inventory/ImageUploadCell.tsx`.

**Example Structure**:
```
src/
├── api/
│   ├── inventoryWorkbook.api.ts
│   └── inventoryImages.api.ts
├── hooks/
│   ├── useInventoryWorkbook.ts
│   └── useInventoryImages.ts
├── lib/
│   ├── inventoryGrid/
│   │   ├── workbookHelpers.ts
│   │   ├── imageUpload.ts
│   │   └── inventoryValidation.ts
│   ├── errors.ts
│   └── validators.ts
├── types/
│   ├── inventoryWorkbook.ts
│   └── inventoryImages.ts
├── components/shared/inventory/
│   └── ImageUploadCell.tsx
└── pages/shared/
    └── InventoryGridPage.tsx
```

**Principles**:
- API → Hooks → Components (data flows one way).
- Extract complex logic from page components into `src/lib/{pageName}/` utilities.
- Keep page components focused on composition, not business logic.
- Invalidate TanStack Query caches in hooks, not in components.

## Code Analysis
- Use **code-review-graph** MCP as the default for architecture, debugging, dependency, and change-impact analysis.
- Always start with `get_minimal_context(task="...")` to reduce token usage.
- Use `detail_level="minimal"` on all queries; only expand to `detail_level="standard"` for specific high-risk items.
- For debugging: prefer targeted `query_graph_tool` (callers/callees), `get_flow_tool` (execution paths), `traverse_graph_tool` over broad scans.
- For reviews: use `detect_changes_tool(detail_level="minimal")`, then expand only on risky functions/flows.
- For architecture: use `get_architecture_overview_tool(detail_level="minimal")` and `list_flows_tool(detail_level="minimal")`.

## Deployment Constraints
- Production is Hostinger/LiteSpeed static hosting for `app.verde-qatar.com`.
- `npm run build` outputs `dist/`; keep `public/.htaccess` for SPA deep-link fallback.
- Do not add a Node/Express production server, `server.js`, or `npm start` path unless hosting is explicitly reconfigured.
