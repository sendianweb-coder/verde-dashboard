# Verde Frontend — Agent Guidelines

## Code Context: MCP-First

**Always use MCP tools for code context before falling back to grep/glob.**

MCP tools provide structured graph-based code relationships (callers, callees, imports,
class hierarchies) that are more accurate and context-aware than text search.

### Priority Order

1. **MCP tools** — `codegraphcontext_*` for code search, relationship analysis, and navigation
2. **grep/glob** — only when MCP doesn't cover the query or MCP is unavailable
3. **Task tool (explore agent)** — for broad exploration when neither MCP nor grep/glob suffices

### When to Use MCP

| Task | Use MCP Tool | Instead Of |
|------|-------------|------------|
| Find where a function is called | `codegraphcontext_analyze_code_relationships` (find_callers) | `grep "functionName"` |
| Find what a function calls | `codegraphcontext_analyze_code_relationships` (find_callees) | Manual reading |
| Search for code by name/content | `codegraphcontext_find_code` | `grep` / `glob` |
| Understand class hierarchy | `codegraphcontext_analyze_code_relationships` (class_hierarchy) | Reading files |
| Find dead/unused code | `codegraphcontext_find_dead_code` | Manual grep |
| Check complexity | `codegraphcontext_calculate_cyclomatic_complexity` | Manual analysis |
| Navigate imports | `codegraphcontext_analyze_code_relationships` (find_importers) | `grep "import X"` |

### When to Fall Back to grep/glob

- MCP graph doesn't include the file/module yet
- Searching for string literals, comments, or non-code patterns
- Quick file name lookups (`glob "*.test.tsx"`)
- Regex-based content search across many files
- MCP tools are unavailable or returning errors

### Graph Indexing

If MCP tools return empty results, the code may not be indexed yet:

```bash
# Index the current project
codegraphcontext_add_code_to_graph path="."

# Or index a specific directory
codegraphcontext_add_code_to_graph path="src/"
```

For actively developed code, use `codegraphcontext_watch_directory` to keep the graph in sync.

## Project Conventions

### shadcn/ui Components

**Always use the shadcn CLI to generate shadcn/ui components. Never manually write or copy-paste component code.**

When a new component is needed:

```bash
# Always use CLI — keeps components up-to-date and consistent
npx shadcn@latest add <component-name>

# Example: adding a label component
npx shadcn@latest add label
```

The `components.json` at the project root maps aliases to `src/` so all components land in `src/components/ui/`.

### Why This Rule

- shadcn components are designed to be owned — `npx shadcn@latest add` fetches the latest stable version
- Manual rewrites drift from the source and miss updates
- The project already has this configured correctly (`components.json` aliases map to `src/`)

## Commands

### Development

```bash
npm run dev        # Start dev server
npm run build      # Production build
npm run lint       # Run ESLint
npm run typecheck  # Run TypeScript type checking
```

### Verification

After any code change, run:

```bash
npm run lint && npm run typecheck
```

## Git Workflow

Use the global `git-pushing` skill for all commits and pushes:

```bash
bash ~/.opencode/skills/git-pushing/scripts/smart_commit.sh
```

See `~/.opencode/skills/git-pushing/SKILL.md` for flags and configuration.
