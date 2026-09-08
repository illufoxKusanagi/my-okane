import { budgets, categories, transactions } from '~~/server/db/schema'
import { db } from '~~/server/db'
import { and, eq, isNull, sql } from 'drizzle-orm'
import { throwSafeServerError } from '~~/server/utils/safeError'

export default defineEventHandler(async (event) => {
  try {
    const userId = await getAuthUserId(event)
    const query = getQuery(event)

    const rawMonth = typeof query.month === 'string' ? query.month : ''
    const isValidMonth = /^\d{4}-\d{2}$/.test(rawMonth)
    const now = new Date()
    const fallbackMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
    const month = isValidMonth ? rawMonth : fallbackMonth

    const globalBudgetResult = await db
      .select()
      .from(budgets)
      .where(
        and(
          eq(budgets.userId, userId),
          isNull(budgets.categoryId),
          eq(budgets.month, month)
        )
      )
      .limit(1)

    const globalBudget = globalBudgetResult[0] || null

    const totalSpendingResult = await db
      .select({ total: sql<number>`sum(${transactions.amount})` })
      .from(transactions)
      .where(
        and(
          eq(transactions.userId, userId),
          eq(transactions.type, 'spending'),
          sql`strftime('%Y-%m', datetime(${transactions.transactionDate}, 'unixepoch')) = ${month}`
        )
      )
    const totalSpending = Number(totalSpendingResult[0]?.total || 0)

    const totalIncomeResult = await db
      .select({ total: sql<number>`sum(${transactions.amount})` })
      .from(transactions)
      .where(
        and(
          eq(transactions.userId, userId),
          eq(transactions.type, 'income'),
          sql`strftime('%Y-%m', datetime(${transactions.transactionDate}, 'unixepoch')) = ${month}`
        )
      )
    const totalIncome = Number(totalIncomeResult[0]?.total || 0)

    const allCategories = await db
      .select()
      .from(categories)
      .where(eq(categories.userId, userId))

    const categoryBudgets = await db
      .select()
      .from(budgets)
      .where(
        and(
          eq(budgets.userId, userId),
          eq(budgets.month, month),
          sql`${budgets.categoryId} is not null`
        )
      )

    const categoryTransactions = await db
      .select({
        categoryId: transactions.categoryId,
        total: sql<number>`sum(${transactions.amount})`
      })
      .from(transactions)
      .where(
        and(
          eq(transactions.userId, userId),
          sql`strftime('%Y-%m', datetime(${transactions.transactionDate}, 'unixepoch')) = ${month}`
        )
      )
      .groupBy(transactions.categoryId)

    const budgetMap = new Map(categoryBudgets.map(b => [b.categoryId, b]))
    const transactionMap = new Map(
      categoryTransactions.map(t => [t.categoryId, Number(t.total || 0)])
    )

    const pockets = allCategories.map((cat) => {
      const budget = budgetMap.get(cat.id)
      const spentOrIncome = transactionMap.get(cat.id) || 0
      const budgetAmount = budget ? budget.amount : 0
      return {
        ...cat,
        budgetId: budget ? budget.id : null,
        budgetAmount,
        spent: cat.type === 'spending' ? spentOrIncome : 0,
        earned: cat.type === 'income' ? spentOrIncome : 0,
        remaining:
          cat.type === 'spending'
            ? Math.max(0, budgetAmount - spentOrIncome)
            : 0
      }
    })

    return {
      month,
      globalBudget: globalBudget
        ? {
            id: globalBudget.id,
            amount: globalBudget.amount,
            spent: totalSpending,
            remaining: Math.max(0, globalBudget.amount - totalSpending)
          }
        : null,
      totalIncome,
      totalSpending,
      balance: totalIncome - totalSpending,
      pockets
    }
  } catch (error: unknown) {
    throwSafeServerError(error, { context: 'fetch budgets', fallbackMessage: 'Failed to fetch budgets' })
  }
})
