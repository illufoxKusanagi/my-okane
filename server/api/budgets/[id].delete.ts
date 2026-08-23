import { budgets } from '~~/server/db/schema'
import { db } from '~~/server/db'
import { and, eq } from 'drizzle-orm'
import { throwSafeServerError } from '~~/server/utils/safeError'

export default defineEventHandler(async (event) => {
  try {
    const userId = await getAuthUserId(event)
    const id = Number(getRouterParam(event, 'id'))

    if (isNaN(id)) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Invalid budget ID'
      })
    }

    const existing = await db
      .select()
      .from(budgets)
      .where(and(eq(budgets.id, id), eq(budgets.userId, userId)))
      .limit(1)

    if (existing.length === 0) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Budget not found'
      })
    }

    await db.delete(budgets).where(eq(budgets.id, id))

    return {
      success: true
    }
  } catch (error: unknown) {
    throwSafeServerError(error, { context: 'delete budget', fallbackMessage: 'Failed to delete budget' })
  }
})
