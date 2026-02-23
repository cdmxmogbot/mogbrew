# Observability

Every app in this stack has two-sided visibility: server errors and client errors.

---

## Server-Side (Pages Functions / Workers)

**File:** `src/_shared/logger.ts`

```ts
import { createLogger } from '../_shared/logger';

const logger = createLogger('my-service');

// In a function:
logger.info('Request received', { url, method });
logger.warn('AI response empty', { prompt: prompt.slice(0, 80) });
logger.error('D1 query failed', err, { query, params });
```

All output is **JSON on stdout/stderr**. Cloudflare captures it automatically.

### Viewing Server Logs

```bash
# Live tail (real-time as requests hit the function)
npx wrangler pages deployment tail --project-name <APP_NAME>

# Or: CF Dashboard → Workers & Pages → <project> → Functions tab → Logs
```

Filter examples in the dashboard:
- `{ "level": "error" }` — all errors
- `{ "service": "sos" }` — errors from the SOS function
- `{ "error.name": "TypeError" }` — specific error types

### Log Shape

```json
{
  "level": "error",
  "service": "sos",
  "msg": "Workers AI call failed",
  "ts": 1740000000000,
  "error": {
    "name": "Error",
    "message": "AI binding unavailable",
    "stack": "Error: AI binding...\n    at sos.ts:42"
  },
  "prompt": "translate hello"
}
```

---

## Client-Side (React / Vite)

**Files:** `src/components/ErrorBoundary.tsx`

### Wire in main.tsx

```tsx
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { ErrorBoundary, installGlobalErrorHandlers } from './components/ErrorBoundary';
import App from './App';

// Capture window.onerror + unhandledrejection → POST to /api/errors
installGlobalErrorHandlers();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>
);
```

### Manual reporting

```ts
import { reportClientError } from './components/ErrorBoundary';

// In a catch block, failed fetch, etc:
reportClientError({ type: 'manual', message: 'Fetch to /api/sos failed', status: 500 });
```

### Client Error Endpoint

`functions/api/errors.ts` — receives POSTs, logs them server-side as structured JSON.
Client errors show up in the same Wrangler tail / CF dashboard as server errors.

---

## Upgrade Path: Sentry

When you need a proper dashboard with alerts, grouping, and deploy tracking:

### 1. Install

```bash
npm install @sentry/cloudflare @sentry/react @sentry/vite-plugin
```

### 2. Server (wrap each Pages Function handler)

```ts
import { withSentry } from '@sentry/cloudflare';

export default withSentry(
  (env) => ({ dsn: env.SENTRY_DSN, tracesSampleRate: 0.1 }),
  { fetch: myHandler }
);
```

### 3. Client (src/main.tsx)

```ts
import * as Sentry from '@sentry/react';

Sentry.init({ dsn: import.meta.env.VITE_SENTRY_DSN, integrations: [Sentry.browserTracingIntegration()] });
```

### 4. Source maps (vite.config.ts)

```ts
import { sentryVitePlugin } from '@sentry/vite-plugin';

plugins: [
  sentryVitePlugin({ org: 'mogchat', project: '<app>', authToken: process.env.SENTRY_AUTH_TOKEN })
]
```

### 5. Env vars

Add to `wrangler.toml` and CF Pages → Settings → Environment variables:
```
SENTRY_DSN = "https://...@sentry.io/..."
VITE_SENTRY_DSN = "https://...@sentry.io/..."
```

---

## What "Exactly How to Fix It" Looks Like

When an error hits you get:
1. **Level + service** — which function / component
2. **Message** — what failed
3. **Stack trace** — exact file + line
4. **Context** — the inputs that caused it (url, query, prompt, etc.)
5. **IP + country** (client errors) — helps distinguish real errors vs bots

Zero guesswork.
