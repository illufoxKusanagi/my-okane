import 'dotenv/config'
import { drizzle } from 'drizzle-orm/libsql'
import { createClient } from '@libsql/client'
import { getEnv } from '../utils/runtimeEnv'

type DrizzleDb = ReturnType<typeof drizzle>

let _db: DrizzleDb | null = null

export function getDb(): DrizzleDb {
  if (!_db) {
    const isDev = process.env.NODE_ENV === 'development'
    const isTest = process.env.NODE_ENV === 'test'
    const isLocal = isDev || isTest

    let configUrl = ''
    let configToken = ''
    if (!isLocal) {
      try {
        const config = useRuntimeConfig()
        configUrl = (config.tursoDatabaseUrl as string) || ''
        configToken = (config.tursoAuthToken as string) || ''
      } catch {
        // Outside active Nuxt application context (e.g. standalone script or test runner)
      }
    }

    const rawUrl = isTest
      ? 'file:local.test.db'
      : isDev
        ? 'file:local.dev.db'
        : (configUrl || getEnv('TURSO_DATABASE_URL') || getEnv('DATABASE_URL') || process.env.TURSO_DATABASE_URL)

    if (!rawUrl) {
      throw new Error('TURSO_DATABASE_URL must be configured in production.')
    }

    // Cloudflare Workers requires HTTPS REST protocol; convert raw libsql:// URLs
    const url = rawUrl.startsWith('libsql://')
      ? rawUrl.replace(/^libsql:\/\//, 'https://')
      : rawUrl

    const authToken = isLocal
      ? undefined
      : (configToken || getEnv('TURSO_AUTH_TOKEN') || process.env.TURSO_AUTH_TOKEN)

    const client = createClient({
      url,
      authToken
    })

    _db = drizzle({ client })
  }
  return _db
}

export const db = new Proxy({} as DrizzleDb, {
  get(_target, prop, receiver) {
    const instance = getDb()
    const value = Reflect.get(instance, prop, receiver)
    return typeof value === 'function' ? value.bind(instance) : value
  }
})
