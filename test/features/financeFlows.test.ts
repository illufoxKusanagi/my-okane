// @vitest-environment node
import { describe, it, expect, beforeAll } from 'vitest'
import { migrate } from 'drizzle-orm/libsql/migrator'
import { db } from '~~/server/db'
import { users, categories, transactions, budgets } from '~~/server/db/schema'
import { and, eq } from 'drizzle-orm'

describe('E2E Finance Flow Calculations', () => {
  beforeAll(async () => {
    await migrate(db, { migrationsFolder: './server/db/migrations/turso' })
    await db.delete(transactions)
    await db.delete(budgets)
    await db.delete(categories)
    await db.delete(users)
  })

  it('should calculate monthly budgets, spending totals, and remaining limits correctly', async () => {
    // 1. Create a test user
    const [testUser] = await db
      .insert(users)
      .values({
        name: 'Finance User',
        email: 'finance@example.com',
        passwordHash: 'dummy-hash'
      })
      .returning()

    expect(testUser).toBeDefined()
    if (!testUser) return

    // 2. Create categories
    const [foodCategory] = await db
      .insert(categories)
      .values({
        name: 'Food',
        type: 'spending',
        userId: testUser.id
      })
      .returning()

    const [salaryCategory] = await db
      .insert(categories)
      .values({
        name: 'Salary',
        type: 'income',
        userId: testUser.id
      })
      .returning()

    expect(foodCategory).toBeDefined()
    expect(salaryCategory).toBeDefined()
    if (!foodCategory || !salaryCategory) return

    const targetMonth = '2026-08'

    // 3. Configure budget limits (500k limit for Food)
    await db.insert(budgets).values({
      userId: testUser.id,
      categoryId: foodCategory.id,
      amount: 500000,
      month: targetMonth
    })

    // 4. Add transaction entries
    // Income: 5M
    await db.insert(transactions).values({
      name: 'August Salary',
      type: 'income',
      amount: 5000000,
      categoryId: salaryCategory.id,
      userId: testUser.id
    })

    // Spending 1: 150k Food
    await db.insert(transactions).values({
      name: 'Dinner at McD',
      type: 'spending',
      amount: 150000,
      categoryId: foodCategory.id,
      userId: testUser.id
    })

    // Spending 2: 250k Food
    await db.insert(transactions).values({
      name: 'Sushi Buffet',
      type: 'spending',
      amount: 250000,
      categoryId: foodCategory.id,
      userId: testUser.id
    })

    // 5. Query and calculate stats
    const userTxs = await db
      .select()
      .from(transactions)
      .where(eq(transactions.userId, testUser.id))

    const totalIncome = userTxs
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0)

    const totalSpending = userTxs
      .filter(t => t.type === 'spending')
      .reduce((sum, t) => sum + t.amount, 0)

    expect(totalIncome).toBe(5000000)
    expect(totalSpending).toBe(400000)

    // 6. Verify Food pocket remaining limit (500k limit - 400k spent = 100k remaining)
    const foodBudgetResult = await db
      .select()
      .from(budgets)
      .where(
        and(
          eq(budgets.userId, testUser.id),
          eq(budgets.categoryId, foodCategory.id),
          eq(budgets.month, targetMonth)
        )
      )

    expect(foodBudgetResult.length).toBe(1)
    const limitAmount = foodBudgetResult[0]?.amount ?? 0
    const remainingLimit = limitAmount - totalSpending
    expect(remainingLimit).toBe(100000)
  })

  it('should clean up associated budgets and transactions when a category is deleted', async () => {
    const [user] = await db
      .insert(users)
      .values({ name: 'Delete User', email: 'del-cat@example.com', passwordHash: 'hash' })
      .returning()
    expect(user).toBeDefined()
    if (!user) return

    const [cat] = await db
      .insert(categories)
      .values({ name: 'Leisure', type: 'spending', userId: user.id })
      .returning()
    expect(cat).toBeDefined()
    if (!cat) return

    await db.insert(budgets).values({
      userId: user.id,
      categoryId: cat.id,
      amount: 150000,
      month: '2026-08'
    })

    await db.insert(transactions).values({
      name: 'Cinema',
      type: 'spending',
      amount: 50000,
      categoryId: cat.id,
      userId: user.id
    })

    // Simulate server/api/categories/[id].delete.ts atomic deletion
    await db.transaction(async (tx) => {
      await tx.delete(budgets).where(and(eq(budgets.categoryId, cat.id), eq(budgets.userId, user.id)))
      await tx.delete(transactions).where(and(eq(transactions.categoryId, cat.id), eq(transactions.userId, user.id)))
      await tx.delete(categories).where(and(eq(categories.id, cat.id), eq(categories.userId, user.id)))
    })

    const remainingTxs = await db.select().from(transactions).where(eq(transactions.categoryId, cat.id))
    const remainingBudgets = await db.select().from(budgets).where(eq(budgets.categoryId, cat.id))
    const remainingCats = await db.select().from(categories).where(eq(categories.id, cat.id))

    expect(remainingTxs.length).toBe(0)
    expect(remainingBudgets.length).toBe(0)
    expect(remainingCats.length).toBe(0)
  })
})
