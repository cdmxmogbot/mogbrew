#!/usr/bin/env bash
# Usage: ./new-project.sh <app-name> [dest-dir]
# Creates a new TanStack Start + Cloudflare Workers project from scaffold.

set -euo pipefail

APP_NAME="${1:?Usage: $0 <app-name> [dest-dir]}"
DEST="${2:-/tmp/$APP_NAME}"
SCAFFOLD="$(cd "$(dirname "$0")" && pwd)"

echo "🔨 Creating $APP_NAME → $DEST"
mkdir -p "$DEST"

# Copy scaffold files
cp -r "$SCAFFOLD"/app "$DEST/"
cp "$SCAFFOLD"/package.json "$DEST/"
cp "$SCAFFOLD"/tsconfig.json "$DEST/"
cp "$SCAFFOLD"/vite.config.ts "$DEST/"
cp "$SCAFFOLD"/wrangler.toml "$DEST/"
cp "$SCAFFOLD"/drizzle.config.ts "$DEST/"
cp "$SCAFFOLD"/env.d.ts "$DEST/"
cp "$SCAFFOLD"/setup-repos.sh "$DEST/"
cp "$SCAFFOLD"/.gitignore "$DEST/"
cp "$SCAFFOLD"/CLAUDE.md "$DEST/"
cp "$SCAFFOLD"/AGENTS.md "$DEST/"
cp "$SCAFFOLD"/ARCHITECTURE.md "$DEST/" 2>/dev/null || cp "$SCAFFOLD"/README.md "$DEST/ARCHITECTURE.md"
cp "$SCAFFOLD"/.dev.vars.example "$DEST/" 2>/dev/null || cat > "$DEST/.dev.vars.example" << 'EOF'
# Copy to .dev.vars and fill in secrets — never commit .dev.vars
# SOME_SECRET=
EOF
chmod +x "$DEST/setup-repos.sh"

# Replace APP_NAME placeholder everywhere
find "$DEST" -type f \( -name "*.json" -o -name "*.toml" -o -name "*.md" -o -name "*.ts" -o -name "*.tsx" -o -name "*.sh" \) \
  | xargs sed -i "s/APP_NAME/$APP_NAME/g"

# Init git
cd "$DEST"
git init -q
git add -A
git commit -q -m "chore: init $APP_NAME from scaffold"

echo ""
echo "✅ $APP_NAME created at $DEST"
echo ""
echo "Next steps:"
echo "  1. cd $DEST && bun install"
echo "  2. bun repos:setup            ← clone .repos/ for AI grounding"
echo "  3. bun cf-typegen             ← generate wrangler.d.ts binding types"
echo "  4. Fill in wrangler.toml      ← add your D1/KV/R2 binding IDs"
echo "  5. cp .dev.vars.example .dev.vars && fill in secrets"
echo "  6. Edit CLAUDE.md             ← list your actual bindings"
echo "  7. Edit AGENTS.md             ← describe what the app does"
echo ""
echo "Dev:     bun dev"
echo "Check:   bun check"
echo "Deploy:  CLOUDFLARE_API_TOKEN=\$TOKEN bun deploy"
