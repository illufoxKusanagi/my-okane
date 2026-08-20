// @vitest-environment node
import { describe, it, expect, beforeAll } from 'vitest'
import { migrate } from 'drizzle-orm/libsql/migrator'
import { db } from '~~/server/db'
import { users, categories, transactions } from '~~/server/db/schema'
import { eq } from 'drizzle-orm'

describe('Database Referential Cascades and Data Integrity', () => {
  beforeAll(async () => {
    // Run migrations on local.test.db to ensure tables are loaded
    await migrate(db, { migrationsFolder: './server/db/migrations' })

    // Clean existing test data
    await db.delete(transactions)
    await db.delete(categories)
    await db.delete(users)
  })

  it('should cascade delete transactions when their category is deleted', async () => {
    // 1. Insert a test user
    const [testUser] = await db
      .insert(users)
      .values({
        name: 'Cascade Tester',
        email: 'cascade@example.com',
        passwordHash: 'dummy-hash'
      })
      .returning()

    expect(testUser).toBeDefined()
    if (!testUser) return

    // 2. Insert a test category
    const [testCategory] = await db
      .insert(categories)
      .values({
        name: 'Coffee & Snacks',
        type: 'spending',
        userId: testUser.id
      })
      .returning()

    expect(testCategory).toBeDefined()
    if (!testCategory) return

    // 3. Insert a transaction linked to this category
    const [testTx] = await db
      .insert(transactions)
      .values({
        name: 'Morning Latte',
        type: 'spending',
        amount: 35000,
        categoryId: testCategory.id,
        userId: testUser.id
      })
      .returning()

    expect(testTx).toBeDefined()

    // 4. Verify transaction exists in db
    const txsBefore = await db
      .select()
      .from(transactions)
      .where(eq(transactions.id, testTx.id))
    expect(txsBefore.length).toBe(1)

    // 5. Delete the category and verify it triggers SQL CASCADE
    await db.delete(categories).where(eq(categories.id, testCategory.id))

    // 6. Verify transaction has been purged automatically
    const txsAfter = await db
      .select()
      .from(transactions)
      .where(eq(transactions.id, testTx.id))
    expect(txsAfter.length).toBe(0)
  })
})
