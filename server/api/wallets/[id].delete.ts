import { db } from '~~/server/db'
import { wallets, transactions } from '~~/server/db/schema'
import { and, eq } from 'drizzle-orm'
import { throwSafeServerError } from '~~/server/utils/safeError'

export default defineEventHandler(async (event) => {
  const id = event.context.params?.id?.trim()
  if (!id) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Wallet ID is required'
    })
  }

  try {
    const userId = await getAuthUserId(event)

    await db.transaction(async (tx) => {
      const userWallets = await tx
        .select()
        .from(wallets)
        .where(eq(wallets.userId, userId))

      const targetWallet = userWallets.find(w => w.id === id)
      if (!targetWallet) {
        throw createError({
          statusCode: 404,
          statusMessage: 'Wallet not found'
        })
      }

      if (userWallets.length <= 1) {
        throw createError({
          statusCode: 400,
          statusMessage: 'Cannot delete the only wallet'
        })
      }

      // If the target wallet is default, transfer default status to another wallet
      if (targetWallet.isDefault) {
        const nextDefault = userWallets.find(w => w.id !== id)
        if (nextDefault) {
          await tx
            .update(wallets)
            .set({ isDefault: true })
            .where(and(eq(wallets.id, nextDefault.id), eq(wallets.userId, userId)))
        }
      }

      // Safely detach transactions from deleted wallet
      await tx
        .update(transactions)
        .set({ walletId: null })
        .where(and(eq(transactions.walletId, id), eq(transactions.userId, userId)))

      await tx
        .update(transactions)
        .set({ transferWalletId: null })
        .where(and(eq(transactions.transferWalletId, id), eq(transactions.userId, userId)))

      await tx
        .delete(wallets)
        .where(and(eq(wallets.id, id), eq(wallets.userId, userId)))
    })

    return {
      success: true
    }
  } catch (error) {
    throwSafeServerError(error, {
      context: 'delete wallet',
      fallbackMessage: 'Failed to delete wallet'
    })
  }
})
