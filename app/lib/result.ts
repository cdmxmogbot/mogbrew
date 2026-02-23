/**
 * Typed Result<T, E> — zero deps, zero overhead.
 * Use instead of throw/catch for expected failure paths.
 *
 * @example
 * async function fetchUser(id: string): Promise<Result<User, 'not_found' | 'db_error'>> {
 *   const row = await db.get(id)
 *   if (!row) return err('not_found')
 *   return ok(row)
 * }
 *
 * const result = await fetchUser(id)
 * if (!result.ok) {
 *   // result.error is 'not_found' | 'db_error' — exhaustively checkable
 * }
 */

export type Result<T, E = Error> =
  | { readonly ok: true; readonly value: T }
  | { readonly ok: false; readonly error: E };

export const ok = <T>(value: T): Result<T, never> =>
  ({ ok: true, value }) as Result<T, never>;

export const err = <E>(error: E): Result<never, E> =>
  ({ ok: false, error }) as Result<never, E>;

export function isOk<T, E>(r: Result<T, E>): r is { readonly ok: true; readonly value: T } {
  return r.ok;
}

export function isErr<T, E>(r: Result<T, E>): r is { readonly ok: false; readonly error: E } {
  return !r.ok;
}

/** Unwrap value or throw. Only use at boundaries where you've already narrowed. */
export function unwrap<T, E>(r: Result<T, E>): T {
  if (r.ok) return r.value;
  throw r.error instanceof Error ? r.error : new Error(String(r.error));
}
