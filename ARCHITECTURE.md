# Architecture — APP_NAME

## System Map

```
[Client] → [CF Pages] → [Pages Functions] → [CF Bindings]
                                           ↓
                                    KV / D1 / R2 / AI
```

## Data Flow
[Describe how data moves through the app — request in, what's queried, response out]

## Bindings
| Name | Type | ID | Purpose |
|------|------|----|---------|
| `DB` | D1 | `xxx` | Primary data store |
| `KV` | KV Namespace | `xxx` | Cache / real-time state |
| `R2` | R2 Bucket | `xxx` | Media storage |
| `AI` | Workers AI | — | Edge inference |

## External Dependencies
[List any third-party APIs called — endpoint, auth method, rate limits]
- None (preferred)

## Schema
[D1 tables or KV key patterns]

```sql
-- If D1:
CREATE TABLE example (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ...
);
```

## Environment Variables
| Key | Where | Purpose |
|-----|-------|---------|
| `CREW_KEY` | Secret | Auth for write endpoints |

## Deploy
- **Project:** `APP_NAME` on Cloudflare Pages
- **URL:** `https://APP_NAME.pages.dev`
- **GitHub:** `github.com/cdmxmogbot-png/APP_NAME`
- **Account ID:** `5d0dde44c8014a290272a4bcf4efc4cd`
