# Verde Frontend — Agent Guidelines

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
