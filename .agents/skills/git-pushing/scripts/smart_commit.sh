#!/bin/bash
set -euo pipefail

# =============================================================================
# smart_commit.sh — Universal Git Push Script
# Works in any project: Node, Python, Go, Rust, Java, Ruby, PHP, Make, Docker
# Auto-detects project type, build system, commit type, and scope.
# =============================================================================

# --- Colors & Icons (disabled if not a terminal) ---
if [ -t 1 ]; then
  RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'
  CYAN='\033[0;36m'; BOLD='\033[1m'; RESET='\033[0m'
  OK="✅"; WARN="⚠️"; ERR="❌"; ARROW="→"; ROCKET="🚀"
  MAG="🔍"; FOLDER="📂"; GEAR="⚙️"
else
  RED=''; GREEN=''; YELLOW=''; CYAN=''; BOLD=''; RESET=''
  OK="[OK]"; WARN="[WARN]"; ERR="[ERR]"; ARROW="->"; ROCKET="[PUSH]"
  MAG="[CHECK]"; FOLDER="[DIR]"; GEAR="[SETUP]"
fi

log()  { echo -e "${GREEN}${OK} ${RESET}$*"; }
warn() { echo -e "${YELLOW}${WARN} ${RESET}$*"; }
err()  { echo -e "${RED}${ERR} ${RESET}$*"; }
info() { echo -e "${CYAN}${MAG} ${RESET}$*"; }

# --- Configuration Loading ---
REPO_ROOT="$(git rev-parse --show-toplevel 2>/dev/null)"
if [ -z "$REPO_ROOT" ]; then
  err "Not inside a git repository."
  exit 1
fi

CONFIG_FILE="$REPO_ROOT/.git-pushing.json"
load_config() {
  local key="$1" default="$2"
  if [ -f "$CONFIG_FILE" ] && command -v python3 &>/dev/null; then
    local val
    val=$(python3 -c "
import json, sys
try:
    with open('$CONFIG_FILE') as f:
        cfg = json.load(f)
    keys = '$key'.split('.')
    result = cfg
    for k in keys:
        result = result.get(k, {})
    if result != {}:
        print(result)
    else:
        print('$default')
except: print('$default')
" 2>/dev/null)
    echo "$val"
  else
    echo "$default"
  fi
}

# --- Argument Parsing ---
CUSTOM_MSG=""
SKIP_BUILD=false
SKIP_TEST=false
DRY_RUN=false
FORCE_PUSH=false
NO_CLAUDE_FOOTER=false
NO_PUSH=false
VERBOSE=false

while [[ $# -gt 0 ]]; do
  case "$1" in
    --skip-build)      SKIP_BUILD=true;       shift ;;
    --skip-test)       SKIP_TEST=true;        shift ;;
    --dry-run)         DRY_RUN=true;          shift ;;
    --force)           FORCE_PUSH=true;       shift ;;
    --no-claude-footer) NO_CLAUDE_FOOTER=true; shift ;;
    --no-push)         NO_PUSH=true;          shift ;;
    --verbose|-v)      VERBOSE=true;          shift ;;
    -*)                err "Unknown option: $1"; exit 1 ;;
    *)                 CUSTOM_MSG="$1";       shift ;;
  esac
done

$VERBOSE && set -x

# --- Detect Project Type ---
detect_project_type() {
  if [ -f "package.json" ]; then echo "node"
  elif [ -f "pyproject.toml" ] || [ -f "setup.py" ] || [ -f "setup.cfg" ]; then echo "python"
  elif [ -f "go.mod" ]; then echo "go"
  elif [ -f "Cargo.toml" ]; then echo "rust"
  elif [ -f "pom.xml" ]; then echo "java-maven"
  elif [ -f "build.gradle" ] || [ -f "build.gradle.kts" ]; then echo "java-gradle"
  elif [ -f "Gemfile" ]; then echo "ruby"
  elif [ -f "composer.json" ]; then echo "php"
  elif [ -f "Makefile" ]; then echo "make"
  elif [ -f "Dockerfile" ]; then echo "docker"
  else echo "generic"
  fi
}

# --- Detect Build Command ---
detect_build_command() {
  local proj_type="$1"
  local config_cmd
  config_cmd=$(load_config "build.command" "")

  if [ -n "$config_cmd" ] && [ "$config_cmd" != "" ]; then
    echo "$config_cmd"
    return
  fi

  # Check package.json scripts
  if [ "$proj_type" = "node" ] && command -v node &>/dev/null; then
    local has_build
    has_build=$(node -e "try{const p=require('./package.json');console.log(p.scripts?.build?'yes':'no')}catch{console.log('no')}" 2>/dev/null)
    if [ "$has_build" = "yes" ]; then
      echo "npm run build"
      return
    fi
  fi

  case "$proj_type" in
    node)         echo "npm run build"       ;;
    python)       echo ""                     ;; # No standard build command
    go)           echo "go build ./..."       ;;
    rust)         echo "cargo build"          ;;
    java-maven)   echo "mvn package -q"       ;;
    java-gradle)  echo "gradle build -q"      ;;
    ruby)         echo "bundle exec rake build" ;;
    php)          echo "composer build"        ;;
    make)         echo "make build"            ;;
    docker)       echo "docker build ."        ;;
    generic)      echo ""                      ;;
  esac
}

# --- Detect Test Command ---
detect_test_command() {
  local proj_type="$1"
  local config_cmd
  config_cmd=$(load_config "test.command" "")

  if [ -n "$config_cmd" ] && [ "$config_cmd" != "" ]; then
    echo "$config_cmd"
    return
  fi

  case "$proj_type" in
    node)         echo "npm test"             ;;
    python)       echo "pytest"               ;;
    go)           echo "go test ./..."         ;;
    rust)         echo "cargo test"            ;;
    java-maven)   echo "mvn test -q"           ;;
    java-gradle)  echo "gradle test -q"        ;;
    ruby)         echo "bundle exec rspec"     ;;
    php)          echo "composer test"          ;;
    *)            echo ""                      ;;
  esac
}

# --- Detect Monorepo Subdirectory ---
detect_monorepo_dir() {
  local changed_files
  changed_files=$(git diff --name-only HEAD 2>/dev/null || git ls-files --others --exclude-standard 2>/dev/null)

  if [ -z "$changed_files" ]; then
    echo ""
    return
  fi

  # Extract common top-level directories
  local dirs
  dirs=$(echo "$changed_files" | cut -d'/' -f1 | sort -u)

  local dir_count
  dir_count=$(echo "$dirs" | wc -l | tr -d ' ')

  # If all changes are in one subdirectory with a package.json or similar
  if [ "$dir_count" = "1" ]; then
    local target_dir
    target_dir=$(echo "$dirs" | head -1)
    if [ -d "$target_dir" ] && [ "$target_dir" != "." ]; then
      # Check if it looks like a project subdirectory
      if [ -f "$target_dir/package.json" ] || [ -f "$target_dir/pyproject.toml" ] || \
         [ -f "$target_dir/go.mod" ] || [ -f "$target_dir/Cargo.toml" ]; then
        echo "$target_dir"
        return
      fi
    fi
  fi

  echo ""
}

# --- Detect Commit Type from Changed Files ---
detect_commit_type() {
  local files="$1"

  # Check for new files (feat)
  local new_files
  new_files=$(git diff --cached --diff-filter=A --name-only 2>/dev/null | wc -l | tr -d ' ')
  if [ "$new_files" -gt 0 ]; then
    echo "feat"
    return
  fi

  # Check patterns
  local has_docs=false has_tests=false has_style=false has_config=false has_build=false has_ci=false

  while IFS= read -r file; do
    [ -z "$file" ] && continue
    case "$file" in
      *.md|*.rst|*.txt|docs/*|README*|CHANGELOG*) has_docs=true ;;
      *.test.*|*.spec.*|__tests__/*|test/*|tests/*|*_test.go|*_test.py) has_tests=true ;;
      *.css|*.scss|*.less|*.sass|*.html|*.svg|*.jsx|*.tsx|*.vue) has_style=true ;;
      .eslintrc*|.prettierrc*|tsconfig.*|.babelrc|.editorconfig|.gitignore|.env*) has_config=true ;;
      Dockerfile|docker-compose.*|Makefile|webpack.*|vite.*|rollup.*|*.gradle|pom.xml) has_build=true ;;
      .github/*|.gitlab-ci.*|.circleci/*|Jenkinsfile) has_ci=true ;;
    esac
  done <<< "$files"

  # Priority: test > docs > config > style > build > ci > fix
  if $has_tests && ! $has_docs && ! $has_style; then echo "test"; return; fi
  if $has_docs && ! $has_tests && ! $has_style; then echo "docs"; return; fi
  if $has_config; then echo "chore"; return; fi
  if $has_build; then echo "build"; return; fi
  if $has_ci; then echo "ci"; return; fi

  echo "fix"
}

# --- Detect Scope from Changed Files ---
detect_scope() {
  local files="$1"
  local custom_scope
  custom_scope=$(load_config "commit.scope" "")

  if [ -n "$custom_scope" ] && [ "$custom_scope" != "" ] && [ "$custom_scope" != "null" ]; then
    echo "$custom_scope"
    return
  fi

  # Extract directory parts from changed files
  local dirs
  dirs=$(echo "$files" | sed 's|/[^/]*$||' | sort -u)

  local dir_count
  dir_count=$(echo "$dirs" | wc -l | tr -d ' ')

  if [ "$dir_count" = "1" ]; then
    local dir
    dir=$(echo "$dirs" | head -1)
    # Use the deepest meaningful directory as scope
    local scope
    scope=$(basename "$dir")
    # Skip generic directories
    case "$scope" in
      src|lib|app|packages|apps|modules|internal) ;;
      *) echo "$scope"; return ;;
    esac
  fi

  echo ""
}

# --- Generate Commit Message ---
generate_commit_message() {
  local commit_type="$1" scope="$2" description="$3"

  if [ -n "$scope" ]; then
    echo "${commit_type}(${scope}): ${description}"
  else
    echo "${commit_type}: ${description}"
  fi
}

# --- Generate Description from Changes ---
generate_description() {
  local files="$1"
  local file_count
  file_count=$(echo "$files" | wc -l | tr -d ' ')

  if [ "$file_count" -le 3 ]; then
    # Use filenames for small changes
    local names
    names=$(echo "$files" | sed 's|.*/||' | sed 's/\.[^.]*$//' | tr '\n' ', ' | sed 's/,$//')
    echo "update ${names}"
  else
    echo "update ${file_count} files"
  fi
}

# --- Run Pre-Check ---
run_pre_check() {
  local config_cmd
  config_cmd=$(load_config "build.pre_check" "")

  if [ -n "$config_cmd" ] && [ "$config_cmd" != "" ] && [ "$config_cmd" != "null" ]; then
    info "Running pre-check: $config_cmd"
    if ! eval "$config_cmd"; then
      err "Pre-check failed. Aborting commit."
      exit 1
    fi
  fi
}

# --- Run Build Check ---
run_build_check() {
  if $SKIP_BUILD; then
    warn "Build check skipped (--skip-build)"
    return 0
  fi

  local config_enabled
  config_enabled=$(load_config "build.enabled" "true")
  if [ "$config_enabled" = "false" ]; then
    warn "Build check disabled in config"
    return 0
  fi

  local build_cmd
  build_cmd=$(detect_build_command "$(detect_project_type)")

  if [ -z "$build_cmd" ]; then
    warn "No build command detected. Skipping build check."
    return 0
  fi

  info "Running build check: $build_cmd"
  local build_timeout
  build_timeout=$(load_config "build.timeout" "300")

  # Use gtimeout (coreutils) on macOS, timeout on Linux, or run directly
  local timeout_cmd=""
  if command -v gtimeout &>/dev/null; then
    timeout_cmd="gtimeout $build_timeout"
  elif command -v timeout &>/dev/null; then
    timeout_cmd="timeout $build_timeout"
  fi

  if ${timeout_cmd:-} bash -c "$build_cmd" 2>&1; then
    log "Build successful"
    return 0
  else
    err "Build failed! Aborting commit."
    err "Use --skip-build to bypass this check."
    exit 1
  fi
}

# --- Run Test Check ---
run_test_check() {
  if $SKIP_TEST; then return 0; fi

  local config_enabled
  config_enabled=$(load_config "test.enabled" "false")
  if [ "$config_enabled" != "true" ]; then return 0; fi

  local test_cmd
  test_cmd=$(detect_test_command "$(detect_project_type)")

  if [ -z "$test_cmd" ]; then
    warn "No test command detected. Skipping tests."
    return 0
  fi

  info "Running tests: $test_cmd"
  if eval "$test_cmd" 2>&1; then
    log "Tests passed"
    return 0
  else
    err "Tests failed! Aborting commit."
    exit 1
  fi
}

# --- Check Protected Branch ---
check_protected_branch() {
  local branch="$1"
  local config_protected
  config_protected=$(load_config "push.protected_branches" "main,master,develop")
  local config_confirm
  config_confirm=$(load_config "push.confirm_on_protected" "true")

  if [ "$config_confirm" != "true" ] || $FORCE_PUSH; then return 0; fi

  IFS=',' read -ra PROTECTED <<< "$config_protected"
  for pb in "${PROTECTED[@]}"; do
    pb=$(echo "$pb" | tr -d ' ')
    if [ "$branch" = "$pb" ]; then
      warn "Pushing to protected branch: $branch"
      if [ -t 0 ]; then
        read -rp "Continue? (y/N) " confirm
        if [[ ! "$confirm" =~ ^[Yy]$ ]]; then
          info "Push cancelled."
          exit 0
        fi
      else
        warn "Non-interactive mode. Use --force to push to $branch"
        exit 1
      fi
    fi
  done
}

# =============================================================================
# MAIN
# =============================================================================

echo ""
echo -e "${BOLD}${CYAN}smart_commit${RESET} ${ARROW} Universal Git Push"
echo ""

# --- Run Pre-Check ---
run_pre_check

# --- Detect Monorepo Target ---
MONOREPO_DIR=$(detect_monorepo_dir)
if [ -n "$MONOREPO_DIR" ]; then
  info "Detected monorepo. Targeting: ${BOLD}${MONOREPO_DIR}${RESET}"
  cd "$MONOREPO_DIR"
fi

# --- Stage All Changes ---
info "Staging all changes..."
git add -A

# --- Check for staged changes ---
STAGED_DIFF=$(git diff --cached --name-only)
if [ -z "$STAGED_DIFF" ]; then
  warn "Nothing to commit. Working tree clean."
  exit 0
fi

CHANGED_FILES=$(git diff --cached --name-only)
FILE_COUNT=$(echo "$CHANGED_FILES" | wc -l | tr -d ' ')
log "Staged ${BOLD}${FILE_COUNT}${RESET} changed file(s)"

# --- Determine Commit Type ---
CONFIG_TYPE=$(load_config "commit.type" "")
if [ -n "$CONFIG_TYPE" ] && [ "$CONFIG_TYPE" != "null" ]; then
  COMMIT_TYPE="$CONFIG_TYPE"
else
  COMMIT_TYPE=$(detect_commit_type "$CHANGED_FILES")
fi

# --- Determine Scope ---
SCOPE=$(detect_scope "$CHANGED_FILES")

# --- Determine Description ---
if [ -n "$CUSTOM_MSG" ]; then
  # If user provided a full conventional commit message, use it as-is
  if [[ "$CUSTOM_MSG" =~ ^(feat|fix|docs|style|refactor|perf|test|build|ci|chore|revert)(\(.+\))?!?:\ .+ ]]; then
    COMMIT_MSG="$CUSTOM_MSG"
  else
    # Use custom message as description, prepend detected type
    COMMIT_MSG=$(generate_commit_message "$COMMIT_TYPE" "$SCOPE" "$CUSTOM_MSG")
  fi
else
  DESCRIPTION=$(generate_description "$CHANGED_FILES")
  COMMIT_MSG=$(generate_commit_message "$COMMIT_TYPE" "$SCOPE" "$DESCRIPTION")
fi

# --- Add Claude Footer ---
FOOTER=""
if ! $NO_CLAUDE_FOOTER; then
  FOOTER=$'\n\n'"Co-Authored-By: Claude Opencode <noreply@opencode.ai>"
fi

# --- Run Checks ---
run_build_check
run_test_check

# --- Commit ---
echo ""
info "Committing: ${BOLD}${COMMIT_MSG}${RESET}"
if $DRY_RUN; then
  warn "Dry run — would commit with message:"
  echo -e "${CYAN}${COMMIT_MSG}${FOOTER}${RESET}"
  exit 0
fi

if git commit -m "${COMMIT_MSG}${FOOTER}"; then
  log "Committed: ${COMMIT_MSG}"
else
  err "Commit failed."
  exit 1
fi

# --- Push ---
if $NO_PUSH; then
  log "Commit complete. Push skipped (--no-push)."
  exit 0
fi

BRANCH=$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "HEAD")
check_protected_branch "$BRANCH"

info "Pushing to ${BOLD}${BRANCH}${RESET}..."
if git push -u origin "$BRANCH" 2>&1; then
  echo ""
  echo -e "${GREEN}${ROCKET} Successfully pushed to ${BOLD}${BRANCH}${RESET}"
  echo ""
else
  err "Push failed."
  err "Check remote access and try again."
  exit 1
fi
