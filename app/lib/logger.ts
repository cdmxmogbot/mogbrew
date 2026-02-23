/**
 * Structured JSON logger for Cloudflare Workers (server-side only).
 *
 * In TanStack Start, use only inside createServerFn() or server$ blocks.
 * Output is JSON-formatted — CF Workers Logs captures it automatically.
 *
 * View logs:
 *   npx wrangler tail --name APP_NAME
 *   CF Dashboard → Workers & Pages → APP_NAME → Logs
 *
 * Filter in dashboard by: { "level": "error" } | { "service": "my-service" }
 */

export type LogLevel = 'info' | 'warn' | 'error';

export interface LogEntry {
  level: LogLevel;
  service: string;
  msg: string;
  ts: number;
  error?: { name: string; message: string; stack?: string };
  [key: string]: unknown;
}

export interface Logger {
  info(msg: string, context?: Record<string, unknown>): void;
  warn(msg: string, context?: Record<string, unknown>): void;
  error(msg: string, err?: unknown, context?: Record<string, unknown>): void;
}

export function createLogger(service: string): Logger {
  return {
    info: (msg, ctx) => emit('info', service, msg, undefined, ctx),
    warn: (msg, ctx) => emit('warn', service, msg, undefined, ctx),
    error: (msg, err, ctx) => emit('error', service, msg, err, ctx),
  };
}

function emit(
  level: LogLevel,
  service: string,
  msg: string,
  err?: unknown,
  context?: Record<string, unknown>,
): void {
  const entry: LogEntry = { level, service, msg, ts: Date.now(), ...context };
  if (err !== undefined) entry.error = toErrorShape(err);
  const line = JSON.stringify(entry);
  if (level === 'error') console.error(line);
  else if (level === 'warn') console.warn(line);
  else console.log(line);
}

function toErrorShape(err: unknown): LogEntry['error'] {
  if (err instanceof Error) return { name: err.name, message: err.message, stack: err.stack };
  return { name: 'UnknownError', message: String(err) };
}
