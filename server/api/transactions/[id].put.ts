import { db } from '~~/server/db'
import { transactions, categories } from '~~/server/db/schema'
import { validateUpdateTransaction } from '~~/server/utils/validator'
import { and, eq } from 'drizzle-orm'
import { throwSafeServerError } from '~~/server/utils/safeError'

export default defineEventHandler(async (event) => {
  const id = event.context.params?.id?.trim()
  if (!id) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Transaction ID is required'
    })
  }

  const body = await readBody(event)
  const validation = validateUpdateTransaction(body)

  if (!validation.success) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Validation failed',
      data: validation.error.issues
    })
  }

  try {
    const userId = await getAuthUserId(event)

    // Fetch the existing transaction so partial updates can be validated
    // against the *effective* type and category (new value ?? persisted value).
    const [existing] = await db
      .select()
      .from(transactions)
      .where(and(eq(transactions.id, id), eq(transactions.userId, userId)))
      .limit(1)

    if (!existing) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Transaction not found'
      })
    }

    const effectiveType = validation.data.type ?? existing.type
    const effectiveCategoryId = validation.data.categoryId ?? existing.categoryId

    // Fetch and validate the effective category against the effective type.
    const [category] = await db
      .select()
      .from(categories)
      .where(and(eq(categories.id, effectiveCategoryId), eq(categories.userId, userId)))
      .limit(1)

    if (!category) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Category not found or does not belong to the user'
      })
    }

    if (category.type !== effectiveType) {
      throw createError({
        statusCode: 400,
        statusMessage: `Category type (${category.type}) does not match transaction type (${effectiveType})`
      })
    }

    const updatedTransaction = await db
      .update(transactions)
      .set({
        name: validation.data.name,
        type: validation.data.type,
        amount: validation.data.amount,
        categoryId: validation.data.categoryId,
        walletId: validation.data.walletId,
        notes: validation.data.notes,
        transactionDate: validation.data.transactionDate
      })
      .where(and(eq(transactions.id, id), eq(transactions.userId, userId)))
      .returning()

    if (updatedTransaction.length === 0) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Transaction not found'
      })
    }

    return {
      success: true,
      data: updatedTransaction[0]
    }
  } catch (error: unknown) {
    throwSafeServerError(error, {
      context: 'update transaction',
      fallbackMessage: 'Failed to update transaction'
    })
  }
})
