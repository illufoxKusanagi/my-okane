import { db } from '~~/server/db'
import { wallets, transactions } from '~~/server/db/schema'
import { and, eq, sql } from 'drizzle-orm'
import { validateWalletUpdate } from '~~/server/utils/walletValidator'
import { throwSafeServerError } from '~~/server/utils/safeError'

export default defineEventHandler(async (event) => {
  const id = event.context.params?.id?.trim()
  if (!id) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Wallet ID is required'
    })
  }

  const body = await readBody(event)
  const validation = validateWalletUpdate(body)

  if (!validation.success) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Validation failed',
      data: validation.error.issues
    })
  }

  try {
    const userId = await getAuthUserId(event)

    const updated = await db.transaction(async (tx) => {
      const existing = await tx
        .select()
        .from(wallets)
        .where(and(eq(wallets.id, id), eq(wallets.userId, userId)))
        .limit(1)

      if (existing.length === 0) {
        throw createError({
          statusCode: 404,
          statusMessage: 'Wallet not found'
        })
      }

      if (validation.data.isDefault === true) {
        await tx
          .update(wallets)
          .set({ isDefault: false })
          .where(eq(wallets.userId, userId))
      }

      const updatePayload: Partial<typeof wallets.$inferInsert> = {}
      if (validation.data.name !== undefined) updatePayload.name = validation.data.name
      if (validation.data.type !== undefined) updatePayload.type = validation.data.type
      if (validation.data.accountNumber !== undefined) updatePayload.accountNumber = validation.data.accountNumber
      if (validation.data.color !== undefined) updatePayload.color = validation.data.color
      if (validation.data.icon !== undefined) updatePayload.icon = validation.data.icon
      if (validation.data.initialBalance !== undefined) updatePayload.initialBalance = validation.data.initialBalance
      if (validation.data.isDefault !== undefined) updatePayload.isDefault = validation.data.isDefault

      const [res] = await tx
        .update(wallets)
        .set(updatePayload)
        .where(and(eq(wallets.id, id), eq(wallets.userId, userId)))
        .returning()

      return res
    })

    if (!updated) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Wallet not found'
      })
    }

    const txSums = await db
      .select({
        type: transactions.type,
        total: sql<number>`coalesce(sum(${transactions.amount}), 0)`
      })
      .from(transactions)
      .where(and(eq(transactions.userId, userId), eq(transactions.walletId, id)))
      .groupBy(transactions.type)

    let income = 0
    let spending = 0
    for (const row of txSums) {
      if (row.type === 'income') income += Number(row.total) || 0
      if (row.type === 'spending') spending += Number(row.total) || 0
    }

    return {
      success: true,
      data: {
        ...updated,
        balance: updated.initialBalance + income - spending
      }
    }
  } catch (error) {
    throwSafeServerError(error, {
      context: 'update wallet',
      fallbackMessage: 'Failed to update wallet'
    })
  }
})
