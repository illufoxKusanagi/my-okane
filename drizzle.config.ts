import { defineConfig } from 'drizzle-kit'
import { config } from 'dotenv'

config()

const isProd = process.env.NODE_ENV === 'production'

export default defineConfig({
  schema: './server/db/schema.ts',
  out: './server/db/migrations/turso',
  dialect: 'turso',
  dbCredentials: {
    url: isProd ? process.env.TURSO_DATABASE_URL! : 'file:local.dev.db',
    authToken: isProd ? process.env.TURSO_AUTH_TOKEN : undefined
  }
})
