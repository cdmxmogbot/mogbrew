#!/usr/bin/env bash
# setup-repos.sh — Clone source repos into .repos/ for AI agent reference.
#
# .repos/ is gitignored — run once after project init, or --update to refresh.
# AI coding agents grep .repos/ before using any library API.
# This eliminates hallucinated function signatures. See CLAUDE.md.
#
# Usage:
#   bash setup-repos.sh           # initial clone (idempotent)
#   bash setup-repos.sh --update  # pull latest on all repos
#   bun repos:setup
#   bun repos:update

set -euo pipefail

UPDATE=false
[[ "${1:-}" == "--update" ]] && UPDATE=true

REPOS_DIR=".repos"
mkdir -p "$REPOS_DIR"

# ─────────────────────────────────────────────────────────────
# Helper: sparse clone or update
# ─────────────────────────────────────────────────────────────
clone_sparse() {
  local url="$1"
  local dir="$REPOS_DIR/$2"
  shift 2
  local packages=("$@")

  if [[ -d "$dir/.git" ]]; then
    if $UPDATE; then
      echo "↻  Updating $dir..."
      git -C "$dir" sparse-checkout add "${packages[@]}" 2>/dev/null || true
      git -C "$dir" pull --ff-only --quiet 2>/dev/null || true
    else
      echo "✓  $dir (pass --update to refresh)"
    fi
    return
  fi

  echo "⬇  Cloning $(basename "$dir")..."
  git clone --filter=blob:none --sparse --depth=1 --quiet "$url" "$dir"
  cd "$dir"
  git sparse-checkout set "${packages[@]}"
  cd - > /dev/null
  echo "   → $(echo "${packages[@]}" | tr ' ' '\n' | head -3 | tr '\n' ' ')..."
}

# ─────────────────────────────────────────────────────────────
# tanstack/router
# Verified paths (as of Feb 2026):
#   createServerFn    → packages/start-client-core/src/createServerFn.ts
#   createFileRoute   → packages/react-router/src/fileRoute.ts
#   createRootRoute   → packages/react-router/src/
#   StartClient       → packages/react-start/
#   server entry      → packages/react-start-server/
# ─────────────────────────────────────────────────────────────
clone_sparse \
  "https://github.com/tanstack/router.git" \
  "tanstack-router" \
  "packages/react-router" \
  "packages/react-start" \
  "packages/react-start-client" \
  "packages/react-start-server" \
  "packages/start-client-core" \
  "packages/start-server-core" \
  "packages/start-storage-context" \
  "packages/router-core" \
  "docs"

# ─────────────────────────────────────────────────────────────
# tanstack/query
# Verified paths:
#   useQuery          → packages/react-query/src/useQuery.ts
#   queryOptions      → packages/query-core/src/queryOptions.ts
#   QueryClient       → packages/query-core/src/queryClient.ts
# ─────────────────────────────────────────────────────────────
clone_sparse \
  "https://github.com/tanstack/query.git" \
  "tanstack-query" \
  "packages/query-core" \
  "packages/react-query" \
  "docs"

# ─────────────────────────────────────────────────────────────
# cloudflare/workers-sdk
# Verified paths:
#   @cloudflare/vite-plugin → packages/vite-plugin-cloudflare/
#   CF binding types        → packages/workers-shared/
# Note: getCloudflareContext lives in the virtual module 'cloudflare:workers'
#   injected at runtime — grep packages/vite-plugin-cloudflare/src/ for usage
# ─────────────────────────────────────────────────────────────
clone_sparse \
  "https://github.com/cloudflare/workers-sdk.git" \
  "cloudflare-workers-sdk" \
  "packages/vite-plugin-cloudflare" \
  "packages/workers-shared"

# ─────────────────────────────────────────────────────────────
# drizzle-team/drizzle-orm
# Verified paths:
#   D1 driver           → drizzle-orm/src/d1/
#   SQLite core         → drizzle-orm/src/sqlite-core/
#   Query builders      → drizzle-orm/src/sqlite-core/query-builders/
# ─────────────────────────────────────────────────────────────
clone_sparse \
  "https://github.com/drizzle-team/drizzle-orm.git" \
  "drizzle-orm" \
  "drizzle-orm/src/d1" \
  "drizzle-orm/src/sqlite-core" \
  "drizzle-kit/src"

echo ""
echo "✅ .repos/ ready — $(du -sh "$REPOS_DIR" 2>/dev/null | cut -f1) total"
echo ""
echo "Key greps (verified paths):"
echo "  grep -r \"createServerFn\" .repos/tanstack-router/packages/start-client-core/src/"
echo "  grep -r \"createFileRoute\" .repos/tanstack-router/packages/react-router/src/"
echo "  grep -r \"useQuery\" .repos/tanstack-query/packages/react-query/src/"
echo "  grep -r \"cloudflare(\" .repos/cloudflare-workers-sdk/packages/vite-plugin-cloudflare/src/"
echo "  grep -r \"drizzle(\" .repos/drizzle-orm/drizzle-orm/src/d1/"
echo ""
echo "Pin to installed versions after bun install:"
echo "  ROUTER_VER=\$(node -p \"require('./node_modules/@tanstack/react-router/package.json').version\")"
echo "  git -C .repos/tanstack-router fetch --tags --quiet && git -C .repos/tanstack-router checkout \"v\$ROUTER_VER\" 2>/dev/null || true"
