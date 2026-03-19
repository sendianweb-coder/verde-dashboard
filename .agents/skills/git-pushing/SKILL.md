---
name: git-pushing
description: >
  This skill should be used when the user asks to "push changes", "commit and push",
  "push this", "push to github", "push to remote", "save and push", "commit my changes",
  or mentions saving work to remote. Also activates on phrases like "let's push this up",
  "commit these changes", "sync to remote", or any git workflow request involving
  staging, committing, and pushing.
---

# Git Push Workflow

Stage all changes, create a conventional commit with auto-detected type and scope,
run build verification, and push to the remote branch. Works in any project type
without hardcoded paths or assumptions.

## Core Workflow

**Always use the script** — do not run manual git commands:

```bash
bash <skill-path>/scripts/smart_commit.sh
```

Where `<skill-path>` is the path to this skill directory. Determine it relative to
the project root. For example, if the skill is at `.agents/skills/git-pushing`:

```bash
bash .agents/skills/git-pushing/scripts/smart_commit.sh
```

With a custom message:

```bash
bash .agents/skills/git-pushing/scripts/smart_commit.sh "feat: add login page"
```

If a full conventional commit message is provided (with type prefix), it is used as-is.
If only a description is provided, the script prepends the auto-detected type and scope.

## What the Script Does

1. **Stages all changes** (`git add -A`)
2. **Detects commit type** from changed file patterns (feat, fix, docs, test, chore, etc.)
3. **Detects scope** from the directory containing changes
4. **Detects project type** (Node, Python, Go, Rust, Java, Ruby, PHP, Make, Docker)
5. **Runs build check** using the project's build system
6. **Commits** with conventional commit format and Claude footer
7. **Pushes** to the current branch with upstream tracking

## Flags

| Flag | Description |
|------|-------------|
| `--skip-build` | Skip the build verification step |
| `--skip-test` | Skip the test execution step (if enabled in config) |
| `--dry-run` | Show what would be committed without committing |
| `--force` | Skip protected branch confirmation |
| `--no-claude-footer` | Omit the Co-Authored-By Claude footer |
| `--no-push` | Commit only, do not push |
| `-v`, `--verbose` | Enable verbose output |

Example with flags:

```bash
bash .agents/skills/git-pushing/scripts/smart_commit.sh --skip-build "fix: resolve auth bug"
```

## Auto-Detection

The script automatically detects:

- **Project type** from config files (`package.json`, `Cargo.toml`, `go.mod`, etc.)
- **Build command** from the project's standard scripts
- **Commit type** from changed file patterns (docs, tests, configs, code)
- **Scope** from the directory containing changes
- **Monorepo subdirectory** if all changes are within one workspace

See `references/auto-detection.md` for full detection rules and supported project types.

## Conventional Commits

All commits follow the conventional commits format:

```
<type>[optional scope]: <description>
```

Supported types: `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `build`, `ci`, `chore`, `revert`.

See `references/conventional-commits.md` for full specification and examples.

## Configuration

Place a `.git-pushing.json` file in the project root to customize behavior:

```json
{
  "build": {
    "enabled": true,
    "command": "pnpm build",
    "pre_check": "pnpm lint",
    "timeout": 120
  },
  "test": {
    "enabled": true,
    "command": "pnpm test"
  },
  "commit": {
    "scope": "api",
    "claude_footer": true
  },
  "push": {
    "protected_branches": ["main", "develop"],
    "confirm_on_protected": true
  }
}
```

See `examples/git-pushing.config.example.json` for all available options.

## When to Use

Automatically activate when the user:

- Explicitly asks to push changes ("push this", "commit and push")
- Mentions saving work to remote ("save to github", "push to remote")
- Completes a feature and wants to share it
- Says phrases like "let's push this up" or "commit these changes"
- Wants to sync local work with remote

## IDE / CLI Compatibility

This skill works in any environment that can run bash:

- **VS Code** — via integrated terminal or task runner
- **JetBrains IDEs** — via terminal or external tools
- **Vim/Neovim** — via `:!bash ...` or terminal split
- **Terminal / SSH** — directly from any shell
- **CI/CD pipelines** — as a build/deploy step

No project-specific configuration is required. The script adapts to whatever project
it is run in.

## Additional Resources

### Reference Files

For detailed information, consult:

- **`references/conventional-commits.md`** — Full commit type reference, format rules, examples
- **`references/auto-detection.md`** — Project type detection, monorepo handling, scope detection

### Examples

- **`examples/git-pushing.config.example.json`** — Complete configuration file reference
