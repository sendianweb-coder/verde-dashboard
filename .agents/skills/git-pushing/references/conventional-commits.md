# Conventional Commits Reference

Full specification: https://www.conventionalcommits.org/en/v1.0.0/

## Format

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

## Commit Types

| Type | Description | When to Use |
|------|-------------|-------------|
| `feat` | New feature | Adding functionality that didn't exist before |
| `fix` | Bug fix | Correcting broken behavior |
| `docs` | Documentation | README, comments, docstrings, JSDoc |
| `style` | Formatting | Whitespace, semicolons, trailing commas (no logic change) |
| `refactor` | Restructure | Code change that neither fixes a bug nor adds a feature |
| `perf` | Performance | Code change that improves performance |
| `test` | Tests | Adding or updating tests |
| `build` | Build system | Webpack, Vite, Rollup, Makefile, Dockerfile |
| `ci` | CI/CD | GitHub Actions, GitLab CI, Jenkins, CircleCI |
| `chore` | Maintenance | Dependencies, configs, tooling, non-src changes |
| `revert` | Revert | Reverting a previous commit |

## Scopes

Scopes are optional and provide contextual information about the change. Common patterns:

- **Component:** `feat(auth):`, `fix(api):`, `refactor(utils):`
- **File group:** `docs(readme):`, `test(unit):`, `style(css):`
- **Feature area:** `feat(dashboard):`, `fix(profile):`

## Examples

### Simple commits
```
feat: add user authentication
fix: resolve null pointer in login flow
docs: update API reference
chore: bump dependencies
```

### With scope
```
feat(auth): implement OAuth2 login
fix(api): handle 429 rate limiting
refactor(utils): extract date formatting
test(auth): add integration tests for login
```

### With body and footer
```
feat(auth): implement OAuth2 login

Add support for Google and GitHub OAuth providers.
Includes token refresh logic and session management.

Closes #123
```

### Breaking changes
```
feat!: change user API response format

BREAKING CHANGE: user object no longer includes `full_name`,
use `first_name` and `last_name` instead.
```

## Auto-Detection Rules

The script maps file changes to commit types:

| Changed Files | Detected Type |
|---------------|---------------|
| `*.md`, `*.rst`, `*.txt` | `docs` |
| `*.test.*`, `*spec.*`, `__tests__/` | `test` |
| `*.css`, `*.scss`, `*.less`, `*.html` | `style` |
| `Dockerfile`, `docker-compose.*`, `.github/` | `build` or `ci` |
| `package.json`, `Cargo.toml`, `go.mod` | `chore` |
| `*.ts`, `*.tsx`, `*.js`, `*.jsx`, `*.py`, `*.go`, `*.rs` | `feat` or `fix` |
| `.eslintrc*`, `.prettierrc*`, `tsconfig.json` | `chore` |

## Commit Message Best Practices

1. **Use imperative mood** in the description: "add feature" not "added feature"
2. **Keep description under 72 characters** for terminal compatibility
3. **Use scope when relevant** to clarify what part of the code changed
4. **Reference issues** in the footer: `Closes #123`, `Fixes #456`
5. **Mark breaking changes** with `!` after type or `BREAKING CHANGE:` footer
