# Auto-Detection Reference

The smart_commit script auto-detects project type, build system, and commit type
to work across any project without configuration.

## Project Type Detection

Detected by checking for characteristic files in the working directory:

| Project Type | Detection Files | Default Build Command | Default Test Command |
|--------------|----------------|-----------------------|----------------------|
| Node.js | `package.json` | `npm run build` | `npm test` |
| Python | `pyproject.toml`, `setup.py`, `setup.cfg` | `python -m build` | `pytest` |
| Go | `go.mod` | `go build ./...` | `go test ./...` |
| Rust | `Cargo.toml` | `cargo build` | `cargo test` |
| Java/Maven | `pom.xml` | `mvn package` | `mvn test` |
| Java/Gradle | `build.gradle`, `build.gradle.kts` | `gradle build` | `gradle test` |
| Ruby | `Gemfile` | `bundle exec rake build` | `bundle exec rspec` |
| PHP | `composer.json` | `composer build` | `composer test` |
| Make | `Makefile` | `make build` | `make test` |
| Docker | `Dockerfile` | `docker build .` | N/A |
| Generic | None | N/A | N/A |

## Build Command Override

The script checks for custom build commands in this order:

1. `.git-pushing.json` config file (project root)
2. Project-specific scripts in `package.json` / `pyproject.toml` etc.
3. Standard conventions (see table above)
4. Skip if no build system detected

## Monorepo Handling

For monorepos, the script detects the changed files and runs build only
in affected packages:

### Detection Strategy

1. Run `git diff --name-only` to identify changed files
2. Extract the top-level directory of each changed file
3. If all changes are within a subdirectory, cd into that directory
4. Otherwise, run from repo root

### Supported Monorepo Structures

- **npm workspaces:** Changes in `packages/*` or `apps/*`
- **Turborepo:** Changes in monorepo packages
- **Lerna:** Changes in `packages/*`
- **Nx:** Changes in `libs/*` or `apps/*`
- **Rust workspaces:** Changes in `crates/*` or `members/*`
- **Go modules:** Changes in module subdirectories

## Commit Type Auto-Detection

Based on `git diff --name-only` output:

### Rule Priority (highest first)

1. **Breaking change markers** → `feat!` or `fix!`
2. **Only test files changed** → `test`
3. **Only documentation changed** → `docs`
4. **Only config/tooling changed** → `chore`
5. **New files added** → `feat`
6. **Existing files modified** → `fix`
7. **Default** → `chore`

### File Pattern Matching

```
docs:    *.md, *.rst, *.txt, docs/*, README*
style:   *.css, *.scss, *.less, *.sass, *.html, *.svg
test:    *.test.*, *.spec.*, __tests__/*, test/*, tests/*
build:   Dockerfile, docker-compose.*, Makefile, webpack.*, vite.*, rollup.*
ci:      .github/*, .gitlab-ci.*, .circleci/*, Jenkinsfile
config:  .eslintrc*, .prettierrc*, tsconfig.*, .babelrc, .env*
```

## Scope Detection

When changes are confined to a specific directory or module, the script
auto-detects scope from the directory name:

```
src/auth/login.ts    → feat(auth):
src/api/users.ts     → feat(api):
packages/core/       → feat(core):
lib/utils/helpers.py → feat(utils):
```

Scope is extracted from the deepest meaningful directory in the changed file path.
If files span multiple scopes, scope is omitted.

## Edge Cases

### Empty commit
If `git diff --cached` is empty after staging, the script reports "nothing to commit"
and exits cleanly without error.

### Detached HEAD
If not on a branch, the script uses the current commit hash as the branch reference
and warns the user.

### No remote
If no remote is configured, the script commits locally without pushing and
instructs the user to add a remote.

### Protected branches
If pushing to `main`, `master`, or `develop`, the script warns and requires
confirmation (unless `--force` or `SKIP_CONFIRM=true` is set).
