import 'dotenv/config'
import { drizzle } from 'drizzle-orm/libsql'
import { createClient } from '@libsql/client'

type DrizzleDb = ReturnType<typeof drizzle>

let _db: DrizzleDb | null = null

export function getDb(): DrizzleDb {
  if (!_db) {
    const isDev = process.env.NODE_ENV === 'development'
    const isTest = process.env.NODE_ENV === 'test'
    const isLocal = isDev || isTest

    const url = isTest
      ? 'file:local.test.db'
      : isDev
        ? 'file:local.dev.db'
        : (process.env.TURSO_DATABASE_URL || process.env.DATABASE_URL)

    if (!url) {
      throw new Error('TURSO_DATABASE_URL must be configured in production.')
    }

    const client = createClient({
      url,
      authToken: isLocal ? undefined : process.env.TURSO_AUTH_TOKEN
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
