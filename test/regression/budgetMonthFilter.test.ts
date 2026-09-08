// @vitest-environment node
import { describe, it, expect, beforeAll } from 'vitest'
import { migrate } from 'drizzle-orm/libsql/migrator'
import { sql } from 'drizzle-orm'
import { db } from '~~/server/db'
import { users, categories, transactions, budgets } from '~~/server/db/schema'

/**
 * Regression test for the budgets month-filter bug: the handler divided
 * unix-second timestamps by 1000 (as if they were milliseconds), making
 * strftime classify every transaction as 1970-01 so budget spending,
 * income, and pocket progress never matched real transactions.
 *
 * transactionDate uses drizzle `mode: 'timestamp'` = unix SECONDS.
 */
describe('Budgets month filter (unix-seconds timestamps)', () => {
  beforeAll(async () => {
    await migrate(db, { migrationsFolder: './server/db/migrations' })
    await db.delete(transactions)
    await db.delete(budgets)
    await db.delete(categories)
    await db.delete(users)
  })

  it('matches transactions for their real month without /1000', async () => {
    const [testUser] = await db
      .insert(users)
      .values({ name: 'Budget User', email: 'budget-filter@example.com', passwordHash: 'x' })
      .returning()
    expect(testUser).toBeDefined()
    if (!testUser) return

    const [cat] = await db
      .insert(categories)
      .values({ name: 'Food', type: 'spending', userId: testUser.id })
      .returning()

    await db.insert(transactions).values({
      name: 'Dinner',
      type: 'spending',
      amount: 100000,
      categoryId: cat!.id,
      userId: testUser.id,
      transactionDate: new Date(Date.UTC(2026, 7, 15, 12, 0, 0)) // 2026-08-15 UTC
    })

    // The exact expression used by server/api/budgets/index.get.ts
    const result = await db.all<{ month: string }>(sql`
      SELECT strftime('%Y-%m', datetime(transaction_date, 'unixepoch')) AS month
      FROM transactions
      WHERE user_id = ${testUser.id}
        AND strftime('%Y-%m', datetime(transaction_date, 'unixepoch')) = '2026-08'
    `)

    expect(result.length).toBe(1)
    expect(result[0]?.month).toBe('2026-08')

    // The old buggy expression (/1000 on already-second timestamps)
    const buggy = await db.all<{ month: string }>(sql`
      SELECT strftime('%Y-%m', datetime(transaction_date / 1000, 'unixepoch')) AS month
      FROM transactions
      WHERE user_id = ${testUser.id}
    `)
    expect(buggy[0]?.month).toBe('1970-01')
  })
})
