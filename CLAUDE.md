# CLAUDE.md — APP_NAME

Read this before writing a single line. These are invariants.

## Stack
- **Runtime:** Cloudflare Workers (TanStack Start on CF Workers)
- **Framework:** TanStack Start + TanStack Router (file-based routes)
- **Bindings:** [LIST: KV / D1 / R2 / AI / ERRORS]
- **Deploy:** `bun deploy` → `wrangler deploy` (Worker, not Pages)

---

## Before Using Any Library API — Mandatory

**Always grep .repos/ before writing code that calls a library.**

.repos/ contains the actual source + tests + docs for every library we use.
This eliminates hallucinated function signatures. It takes 5 seconds and saves hours.

```bash
# TanStack Start — server functions (createServerFn lives in start-client-core, not react-start)
grep -r "createServerFn" .repos/tanstack-router/packages/start-client-core/src/
grep -r "createMiddleware" .repos/tanstack-router/packages/start-client-core/src/

# TanStack Router — file routes, root route, navigation
grep -r "createFileRoute" .repos/tanstack-router/packages/react-router/src/
grep -r "createRootRoute" .repos/tanstack-router/packages/react-router/src/
grep -r "Link\|useNavigate\|useParams" .repos/tanstack-router/packages/react-router/src/

# Cloudflare vite-plugin — binding access, CF context
grep -r "cloudflare(" .repos/cloudflare-workers-sdk/packages/vite-plugin-cloudflare/src/
ls .repos/cloudflare-workers-sdk/packages/vite-plugin-cloudflare/src/

# TanStack Query — data fetching
grep -r "useQuery\|useMutation\|queryOptions" .repos/tanstack-query/packages/react-query/src/
grep -r "QueryClient" .repos/tanstack-query/packages/query-core/src/
```

If .repos/ is empty, run: `bun repos:setup`

---

## Code Rules

### TypeScript
- `"strict": true` + `"noUncheckedIndexedAccess": true` + `"exactOptionalPropertyTypes": true`
- No `any`. Use `unknown` and narrow explicitly.
- All function parameters and return types must be explicitly typed.
- Use `satisfies` over `as` for type assertions.
- `verbatimModuleSyntax` is on — use `import type` for type-only imports.

### Style
- Format with oxfmt before committing: `npm run fmt`
- Lint with oxlint: `npm run lint`
- No unused variables or parameters — these are errors.
- `prefer-const` everywhere. No `let` unless mutation is required.
- No `var`.

### CF Bindings — How to Access Them
CF bindings (`env.DB`, `env.KV`, etc.) come from the `cloudflare:workers` virtual module.
**Never use `getCloudflareContext()` — that's the wrong API for this stack.**

```ts
import { env } from '~/lib/env'   // re-exports from 'cloudflare:workers'

// In any server function:
const rows = await env.DB.prepare('SELECT * FROM items').all()
const val = await env.KV.get('key')
```

Types are generated from wrangler.toml: `bun cf-typegen` → `wrangler.d.ts` → augmented by `env.d.ts`.

### Database — Drizzle on D1
Always use Drizzle (`~/lib/db.ts`) over raw `.prepare()` strings.

```ts
import { db } from '~/lib/db'
import { items } from '~/db/schema'
import { eq } from 'drizzle-orm'

// Typed, safe, autocompleted:
const allItems = await db.select().from(items)
const item = await db.select().from(items).where(eq(items.id, id)).get()
await db.insert(items).values({ name: 'thing' }).run()
```

Add tables in `app/db/schema/index.ts`, then:
```bash
bun db:generate   # generate migration SQL
bun db:migrate    # apply locally
bun db:migrate:remote  # apply to CF D1
```

⚠️ Verify Drizzle D1 API before writing queries:
```bash
grep -r "sqliteTable\|.select\|.insert\|.where" .repos/drizzle-orm/drizzle-orm/src/sqlite-core/
```

### TanStack Start — Server Functions

```ts
import { createServerFn } from '@tanstack/react-start'
import { db } from '~/lib/db'
import { items } from '~/db/schema'

const getItems = createServerFn({ method: 'GET' }).handler(async () => {
  return db.select().from(items).all()
})

export const Route = createFileRoute('/')({
  loader: () => getItems(),
  component: Home,
})
```

⚠️ Verify exact createServerFn API:
```bash
grep -r "createServerFn" .repos/tanstack-router/packages/start-client-core/src/createServerFn.ts
```

### oRPC (optional — for apps with a dedicated API layer)
When an app needs a standalone Hono Worker backend (separate from the TanStack Start frontend):

```ts
// Server — packages/api/src/index.ts
import { os } from '@orpc/server'
import { env } from '~/lib/env'

export const o = os.$context<{ db: typeof db }>()
export const publicProcedure = o

// Client — app/utils/orpc.ts
import { createORPCClient } from '@orpc/client'
import { createTanstackQueryUtils } from '@orpc/tanstack-query'
export const orpc = createTanstackQueryUtils(createORPCClient(link))

// Usage in component:
const { data } = orpc.items.list.useQuery()
```

⚠️ Only add oRPC when you need a standalone backend Worker. For co-located server functions, use `createServerFn` instead.

### TanStack Start — Routes
- File-based routing. Every route file exports `const Route = createFileRoute('...')({...})`.
- `__root.tsx` is the root layout — edit `<head>` meta here.
- Loaders run server-side. Components are client + server.
- Never fetch data in `useEffect`. Use loaders or `useQuery`.

### Error Handling
- Use `Result<T, E>` from `~/lib/result.ts` for expected failures.
- Use `createLogger(service)` from `~/lib/logger.ts` in all server functions.
- All errors persisted to D1 via `logError()` from `~/lib/db.ts`.
- `<ErrorBoundary>` wraps the app in `client.tsx` — never remove.

### Architecture
- No in-memory state. All state in CF bindings (D1 / KV / R2).
- No external HTTP calls unless documented in ARCHITECTURE.md.
- Secrets in `.dev.vars` (local) and `wrangler secret put` (prod). Never hardcoded.

---

## Project Structure
```
app/
  routes/           # File-based routes (TanStack Router)
    __root.tsx      # Root layout, <head> meta
    index.tsx       # Home route
  components/       # Shared React components
    ErrorBoundary.tsx
  lib/
    result.ts       # Result<T,E> typed error handling
    logger.ts       # Structured JSON server logger
    db.ts           # D1 error logging (logError)
  router.tsx        # Router config
  client.tsx        # Browser entry (hydration)
.repos/             # Gitignored source refs for AI grounding
setup-repos.sh      # Populate .repos/
wrangler.toml       # CF Worker config + bindings
vite.config.ts
```

---

## Observability — Always On

### Server
- Use `createLogger(service)` from `~/lib/logger.ts` in every server function.
- Wrap all async logic in try/catch — `logger.error(msg, err, context)` in catch.
- Include context: the inputs that caused the error, not just the message.
- View: `npx wrangler tail --name APP_NAME` or CF Dashboard → APP_NAME → Logs.

### Client
- `<ErrorBoundary>` in `client.tsx` — catches React tree crashes.
- `installGlobalErrorHandlers()` in `client.tsx` — captures `window.onerror`.
- Client errors POST to the errors server function → D1.

### D1 Error Log
- All errors (server + client) written to `mogerrors` D1 via `logError()` in `~/lib/db.ts`.
- VM cron polls D1 every 5 min → agent diagnoses and fixes automatically.

---

## Deploy
```bash
bun deploy
```
Runs `vite build && wrangler deploy`. Deploys as a Worker (not Pages).
Direct to production — no staging. Commit before deploying.

## Generate CF Types
```bash
bun cf-typegen
# Generates wrangler.d.ts with typed env bindings
```

## Tests
```bash
bun test   # vitest run
```
