# Verde Frontend - Agent Playbook
Practical instructions for coding agents working in this repository. Keep this file current and short enough to reread.

## Scope
- Applies to the frontend app in `/Users/farsin/sendiangroup/Verde-app/frontend`.
- If repo-level instructions conflict with generic agent defaults, follow this file.
- There are currently no Cursor rules in `.cursor/rules/` or `.cursorrules`.
- There is currently no Copilot instruction file at `.github/copilot-instructions.md`.

## Working Style
- For non-trivial work: plan -> execute -> verify.
- If the implementation starts diverging from the plan, stop and re-plan.
- Prefer small, composable changes over broad rewrites.
- Match existing project patterns before introducing new abstractions.

## Repo Snapshot
- Stack: React 19, TypeScript 5, Vite 8, Tailwind 4.
- State: TanStack Query for server state, Zustand for client/session state.
- Routing: React Router with role-gated protected routes.
- UI: Radix primitives with shadcn/ui-style components under `src/components/ui`.
- API layer: Axios client plus domain modules in `src/api`.
- Validation: Zod schemas in `src/lib/validators.ts`.
- Path alias: `@/* -> src/*` from `tsconfig.app.json`.

## Important Directories
- `src/api`, `src/hooks`, `src/store`, `src/routes`: data flow, state, and routing.
- `src/components/ui`, `src/components/shared`: reusable primitives and app-specific building blocks.
- `src/pages`: route-level screens grouped by role.
- `src/types`, `src/lib`: domain types, validators, constants, errors, and query client.

## Install / Build / Lint / Preview
Run commands from `/Users/farsin/sendiangroup/Verde-app/frontend`.

```bash
npm install
npm run dev
npm run lint
npm run build
npm run preview
```

## Test Commands
Current repo state:
- `package.json` does not define a `test` script.
- No Vitest, Jest, Playwright, or other test runner config is present.
- No `*.test.*` or `*.spec.*` files are present today.

Implications:
- There is no runnable repository test command right now.
- Do not claim tests passed unless a test runner is added and executed.

If tests are added later, prefer these patterns:

```bash
# run all tests once
npm run test

# run a single test file through the package script
npm run test -- src/path/to/file.test.ts

# if Vitest is added without a package script
npx vitest run src/path/to/file.test.ts

# if Jest is added instead
npx jest src/path/to/file.test.ts
```

## Required Verification Before Handoff
For any code change, run:

```bash
npm run lint && npm run build
```

Also verify:
- Touched flows still match the requested behavior.
- Role-gated screens still respect access boundaries.
- No unused imports, dead symbols, or accidental `console` noise remain.
- No type suppressions or config weakening were introduced casually.

## Code Discovery Workflow
- Start with structural understanding before editing.
- Prefer MCP/code graph tools for callers, callees, imports, and dependency direction.
- Use `glob` for file discovery and `grep` for targeted content search.
- Read the smallest set of files that explains the pattern you are changing.
- Check adjacent hooks, API modules, routes, and types before changing shared behavior.

## shadcn/ui Rule
When adding a new shadcn component, use the CLI:

```bash
npx shadcn@latest add <component-name>
```

Do not hand-copy shadcn component source into `src/components/ui`.

## Code Style Guidelines

### Imports
- Order imports as: external packages -> blank line -> internal alias/local imports.
- Prefer `@/` imports for modules under `src`.
- Use relative imports mainly for same-folder files such as `./ProtectedRoute`.
- Use `import type` for type-only imports.
- Remove unused imports immediately; TypeScript is configured to reject them.

### Formatting
- Follow the existing ESLint-driven style and current file conventions.
- Prefer concise components and helpers over long monolithic render functions.
- Use early returns to reduce nesting.
- Extract repetitive JSX or transformation logic when a component gets dense.

### TypeScript
- Preserve strict typing; `strict`, `noUnusedLocals`, and `noUnusedParameters` are enabled.
- Avoid `any`; if truly unavoidable, isolate it at the boundary and narrow quickly.
- Reuse domain types from `src/types` instead of redefining similar shapes.
- Keep request/response typing close to API modules.
- Preserve backend nullability and optionality instead of “fixing” it in the UI layer.

### Naming
- Components: `PascalCase` and usually named exports.
- Hooks: `useXxx`.
- Stores: `useXxxStore`.
- Store actions: verbs such as `setSession`, `setUser`, `logout`.
- API modules: `<domain>.api.ts`.
- Query keys: centralized objects like `productsQueryKeys`.
- Constants: `UPPER_SNAKE_CASE`.
- Zod schemas: descriptive camelCase names ending in `Schema`.

### React Patterns
- Prefer function components.
- Keep side effects in hooks or focused effect blocks, not scattered through pages.
- Keep route pages thin when logic can live in hooks or shared components.
- Preserve accessibility basics already present: labels, `role="alert"`, `aria-busy`, sr-only titles.

### TanStack Query Patterns
- Use TanStack Query for async server state; do not duplicate fetched data in Zustand.
- Keep query keys stable, parameterized, and colocated with their hooks.
- Invalidate relevant list/detail queries after successful mutations.
- Use `enabled` guards for queries that depend on route params or IDs.

### API Layer Patterns
- Use the shared Axios client from `src/api/client.ts`.
- Let API functions return already-unwrapped data when the backend response envelope is predictable.
- Keep auth behavior intact: request interceptor adds bearer token, `401` logs out and redirects to `/login`.
- Put endpoint-specific code in domain API files, not directly in pages.

### Validation and Forms
- Use Zod schemas from `src/lib/validators.ts` and `react-hook-form` where forms already follow that pattern.
- Keep validation messages user-facing and specific.
- Encode business rules in schemas when possible, such as duplicate-item or cross-field checks.

### Error Handling
- Do not swallow errors silently.
- Let API/helper layers throw and map errors to user copy near the UI boundary.
- Reuse `getErrorMessage` from `src/lib/errors.ts` for consistent messaging.
- Preserve the current auth/session expiration behavior.

### Routing, Roles, and State
- Respect role boundaries defined in `src/routes/index.tsx`.
- New protected routes must be wrapped in the correct `ProtectedRoute` role gate.
- Keep fallback navigation deterministic with `Navigate` and role route helpers.
- Keep auth/session state in Zustand store modules and persist only the minimum needed.

### UI and Styling
- Follow existing Tailwind utility patterns and design tokens like `bg-page`, `bg-surface-raised`, and `text-text-secondary`.
- Reuse shared UI and shared feature components before creating near-duplicates.
- Preserve responsive behavior across desktop and mobile layouts.

## Git and Change Hygiene
- Keep changes scoped to the task; avoid unrelated cleanup unless it unblocks the work.
- Do not rewrite history unless explicitly asked.
- Do not push directly to `main` unless explicitly instructed.
- In commit or PR text, explain why the change exists, not only what changed.

## Self-Improvement Loop
When a mistake is found:
1. State the root cause in one sentence.
2. Add or refine one rule here that would have prevented it.
3. Remove any stale or duplicate rule in the same edit.
