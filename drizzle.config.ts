import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './app/db/schema/index.ts',
  out: './app/db/migrations',
  dialect: 'sqlite',
  driver: 'd1-http',
});
