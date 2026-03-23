# Verde Frontend - Agent Playbook
For coding agents in this repository. Keep this file minimal, practical, and current.

## Philosophy (Boris-style CLAUDE.md)
- Treat this as living institutional memory, not a long static prompt.
- Add rules from real mistakes/review comments; avoid speculative rules.
- For non-trivial tasks: plan -> execute -> verify.
- If execution deviates from plan, stop and re-plan.
- Prefer elegant fixes over hacks.
- Prune outdated rules regularly, especially after model upgrades.

## Repo Snapshot
- Stack: React 19, TypeScript 5, Vite 8, Tailwind 4.
- Server state: TanStack Query + Axios.
- Client state: Zustand (`src/store`).
- Routing: React Router + role gates (`src/routes`).
- UI primitives: Radix + shadcn/ui.
- Alias: `@/* -> src/*` in `tsconfig.app.json`.

## Build / Lint / Test Commands
Run from: `/Users/farsin/sendiangroup/Verde-app/frontend`

```bash
# install
npm install

# local dev
npm run dev

# lint
npm run lint

# production build (tsc -b + vite build)
npm run build

# preview production build
npm run preview
```

## Test Commands (Current Reality + Single-Test Guidance)
Current state in this repo:
- No `test` script in `package.json`.
- No Vitest/Jest/Playwright config file.
- No `*.test.*` / `*.spec.*` files present.

Implication:
- There is no runnable repository test command today.
- Do not claim tests passed unless a runner is added.

When tests are added, use these patterns:

```bash
# single file via Vitest
npx vitest run src/path/to/file.test.ts

# preferred if package.json gets a test script
npm run test -- src/path/to/file.test.ts
```

## Required Verification Before Handoff
For any code change, run:

```bash
npm run lint && npm run build
```

Also verify:
- Behavior matches request and role/route constraints.
- No obvious regressions in touched flows.
- No unused imports/symbols or type suppressions.

## Code Context Workflow (MCP-first)
Use MCP tools first for structural understanding.

Priority:
1. `codegraphcontext_*` tools.
2. `grep` / `glob` when MCP is insufficient.
3. Explore sub-agent for broad discovery.

Use MCP for callers/callees, importers, symbol lookup, and dependency direction.
If MCP results look unexpectedly empty, refresh/index the graph before fallback search.

## shadcn/ui Rule (Strict)
Use CLI only when adding a shadcn component:

```bash
npx shadcn@latest add <component-name>
```

Never hand-copy shadcn source into `src/components/ui`.

## Code Style Guidelines
### Imports
- Order: external -> blank line -> internal alias/local.
- Prefer `@/` for internal imports under `src`.
- Use `import type` for type-only imports.
- Remove unused imports immediately.

### Formatting
- Follow existing ESLint-driven style.
- Prefer small focused functions and early returns.
- Keep hooks/components composable; avoid deeply nested JSX logic.
- Extract helpers when render logic gets dense.

### TypeScript
- Preserve strict typing (`strict: true`); do not weaken config.
- Avoid `any`; if unavoidable, isolate and document.
- Reuse existing domain types in `src/types/*`.
- Keep API request/response types near API modules.
- Preserve backend nullability in frontend types.

### Naming
- Components: `PascalCase`.
- Hooks: `useXxx`.
- Stores: `useXxxStore`; actions are verbs (`setUser`, `logout`).
- API modules: `<domain>.api.ts`; functions are verb-led.
- Query keys: centralized per domain hook module.
- Constants: `UPPER_SNAKE_CASE`.

### React / Query Patterns
- Prefer function components + named exports.
- Keep side effects in hooks (not scattered in pages).
- Use TanStack Query for server state; avoid duplicating it in Zustand.
- Invalidate relevant queries after successful mutations.
- Keep query keys stable and parameterized.

### Error Handling
- Let API/helper layers throw; avoid swallowing errors.
- Centralize common handling (interceptors, boundaries).
- Preserve current auth behavior: 401 -> logout + `/login` redirect.
- Expose user-facing error feedback where needed.
- No silent failures or empty `catch` blocks.

### Routing / Roles / State
- Respect role boundaries in `src/routes/index.tsx`.
- New protected routes must be wrapped with correct `ProtectedRoute` roles.
- Keep fallback navigation deterministic (`Navigate`).
- Keep auth/session concerns in Zustand store modules.
- Persist only what is needed with `zustand/persist`.

## Git and PR Hygiene
- Commit at logical checkpoints; avoid unrelated change mixing.
- Do not rewrite history unless explicitly requested.
- Do not push directly to `main` unless explicitly instructed.
- In PR notes, explain why, not only what.


## Self-Improvement Loop (Required)
When a mistake is found:
1. State root cause in one sentence.
2. Add/refine one concise rule that prevents recurrence.
3. Remove stale/duplicate rules in the same edit.

Final quality gate:
- "Would a staff engineer approve this change and verification evidence?"
