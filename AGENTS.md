# AGENTS.md — APP_NAME

## What This App Does
[One paragraph: purpose, users, key flows]

## Stack Invariants
- TanStack Start on Cloudflare Workers
- File-based routing (app/routes/)
- CF bindings: [LIST]
- Error logging: mogerrors D1 (always bound as ERRORS)

## The .repos/ Rule — Non-Negotiable

Before using any API from these libraries, search .repos/:

| Library | Grep target |
|---------|-------------|
| TanStack Start (createServerFn, loaders) | `.repos/tanstack-router/packages/react-start/` |
| TanStack Router (routes, navigation) | `.repos/tanstack-router/packages/react-router/` |
| TanStack Query (useQuery, mutations) | `.repos/tanstack-query/packages/react-query/` |
| Cloudflare bindings (getCloudflareContext) | `.repos/cloudflare-workers-sdk/packages/vite-plugin/` |

If .repos/ is missing: `bun repos:setup`

Rationale: these libraries evolve rapidly. Docs lag. The source and tests are ground truth.

## Key Files — Do Not Break
- `app/routes/__root.tsx` — root layout
- `app/router.tsx` — router config
- `app/client.tsx` — browser entry, ErrorBoundary, global error handlers
- `app/lib/result.ts` — typed error handling
- `app/lib/logger.ts` — structured server logger
- `app/lib/db.ts` — D1 error persistence
- `wrangler.toml` — CF bindings (ERRORS binding always required)

## Server Function Pattern
```ts
import { createServerFn } from '@tanstack/react-start'
// binding access import — verify exact path in .repos/cloudflare-workers-sdk/

const myFn = createServerFn({ method: 'GET' }).handler(async () => {
  // server-only logic here
  // access env via getCloudflareContext().env
})
```

## Error Handling Pattern
```ts
import { createLogger } from '~/lib/logger'
import { logError } from '~/lib/db'

const logger = createLogger('my-service')

const myFn = createServerFn().handler(async () => {
  try {
    // ...
  } catch (err) {
    logger.error('What broke', err, { context: 'that helps fix it' })
    await logError(getCloudflareContext().env.ERRORS, err, {
      type: 'server', service: 'my-service',
      metadata: { /* inputs */ }
    })
    throw err  // re-throw so TanStack handles the error boundary
  }
})
```

## Route Pattern
```ts
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/path')({
  loader: () => getData(),    // server-side, runs before render
  component: MyComponent,
  errorComponent: ({ error }) => <div>{String(error)}</div>,
})
```

## Deployment
```bash
bun deploy   # vite build + wrangler deploy
```
Worker, not Pages. No preview env. Commit before deploying.
