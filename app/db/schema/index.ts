/**
 * Drizzle schema — define your tables here.
 *
 * Example:
 *   import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'
 *
 *   export const items = sqliteTable('items', {
 *     id: integer('id').primaryKey({ autoIncrement: true }),
 *     name: text('name').notNull(),
 *     createdAt: text('created_at').notNull().default(sql`(datetime('now'))`),
 *   })
 *
 * After adding tables:
 *   npm run db:generate   → generate migration files
 *   npm run db:migrate    → apply to D1 (local or remote)
 *
 * ⚠️ Verify Drizzle D1 API in .repos/:
 *   grep -r "sqliteTable\|integer\|text" .repos/drizzle-orm/drizzle-orm/src/sqlite-core/
 */

export {};
