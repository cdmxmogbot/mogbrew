# APP_NAME

[One line description]

**Live:** https://APP_NAME.pages.dev

## Stack
- Cloudflare Pages + Pages Functions
- TypeScript (strict)
- [Add bindings: D1 / KV / R2 / Workers AI]

## Dev

```bash
npm install
cp .dev.vars.example .dev.vars  # fill in secrets
npm run dev                      # local dev via wrangler
```

## Lint / Format

```bash
npm run lint    # oxlint
npm run fmt     # oxfmt
npm run typecheck
```

## Deploy

```bash
npm run deploy  # builds + pushes to prod
```

## Docs
- [CLAUDE.md](./CLAUDE.md) — coding invariants
- [AGENTS.md](./AGENTS.md) — app invariants
- [ARCHITECTURE.md](./ARCHITECTURE.md) — system design
