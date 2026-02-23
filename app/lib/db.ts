/**
 * Database — Drizzle ORM on Cloudflare D1.
 *
 * `db` is the typed Drizzle instance for your app's main DB.
 * `logError` persists errors to the shared mogerrors D1 (polled by VM cron).
 *
 * ⚠️ Verify Drizzle D1 patterns in .repos/ before writing queries:
 *   grep -r "drizzle\|DrizzleD1" .repos/drizzle-orm/drizzle-orm/src/d1/
 *   grep -r "\.prepare\|\.all\|\.get\|\.run" .repos/drizzle-orm/drizzle-orm/src/d1/
 */

import { drizzle } from 'drizzle-orm/d1';
import { env } from '~/lib/env';
import * as schema from '~/db/schema';
import { createLogger } from '~/lib/logger';

const logger = createLogger('db');

// ── App database (typed Drizzle instance) ──────────────────────────────────
// Bind your DB in wrangler.toml: [[d1_databases]] binding = "DB"
export const db = drizzle(env.DB, { schema });

// ── Error logging → mogerrors D1 (shared across all apps) ─────────────────

export interface ErrorRecord {
  type: 'server' | 'client';
  service: string;
  app?: string;
  url?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Persist an error to the mogerrors D1 table.
 * VM cron polls it every 5 min → agent reads and acts.
 * Never throws — logging must not break the request path.
 */
export async function logError(error: unknown, opts: ErrorRecord): Promise<void> {
  const msg = error instanceof Error ? error.message : String(error);
  const stack = error instanceof Error ? (error.stack ?? '') : '';

  try {
    await env.ERRORS.prepare(
      `INSERT INTO errors (timestamp, type, service, app, message, stack, url, metadata)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    )
      .bind(
        new Date().toISOString(),
        opts.type,
        opts.service,
        opts.app ?? 'mogbrew',
        msg,
        stack,
        opts.url ?? '',
        JSON.stringify(opts.metadata ?? {}),
      )
      .run();
  } catch (dbErr) {
    logger.error('Failed to write error to D1', dbErr, { originalMsg: msg });
  }
}
