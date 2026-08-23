import { db } from '~~/server/db'
import { transactions, categories } from '~~/server/db/schema'
import { eq, desc } from 'drizzle-orm'
import { throwSafeServerError } from '~~/server/utils/safeError'

export default defineEventHandler(async (event) => {
  try {
    const userId = await getAuthUserId(event)

    const query = getQuery(event)
    const DEFAULT_LIMIT = 1000
    const MAX_LIMIT = 5000
    const limitRaw = Number.parseInt(String(query.limit ?? ''), 10)
    const limit = Number.isFinite(limitRaw)
      ? Math.min(MAX_LIMIT, Math.max(1, limitRaw))
      : DEFAULT_LIMIT
    const offsetRaw = Number.parseInt(String(query.offset ?? ''), 10)
    const offset = Number.isFinite(offsetRaw) ? Math.max(0, offsetRaw) : 0

    const list = await db
      .select({
        id: transactions.id,
        name: transactions.name,
        type: transactions.type,
        amount: transactions.amount,
        notes: transactions.notes,
        transactionDate: transactions.transactionDate,
        categoryId: transactions.categoryId,
        categoryName: categories.name,
        categoryIcon: categories.icon,
        categoryColor: categories.color,
        createdAt: transactions.createdAt
      })
      .from(transactions)
      .leftJoin(categories, eq(transactions.categoryId, categories.id))
      .where(eq(transactions.userId, userId))
      .orderBy(desc(transactions.transactionDate))
      .limit(limit)
      .offset(offset)

    return list
  } catch (error) {
    throwSafeServerError(error, { context: 'fetch transactions', fallbackMessage: 'Failed to fetch transactions' })
  }
})
