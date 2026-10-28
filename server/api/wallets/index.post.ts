import { db } from '~~/server/db'
import { wallets } from '~~/server/db/schema'
import { eq } from 'drizzle-orm'
import { validateWallet } from '~~/server/utils/walletValidator'
import { throwSafeServerError } from '~~/server/utils/safeError'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const validation = validateWallet(body)

  if (!validation.success) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Validation failed',
      data: validation.error.issues
    })
  }

  try {
    const userId = await getAuthUserId(event)

    const createdWallet = await db.transaction(async (tx) => {
      // Check existing wallets count
      const existing = await tx
        .select({ id: wallets.id })
        .from(wallets)
        .where(eq(wallets.userId, userId))

      // If user has no existing wallets, set isDefault: true
      const isDefault = existing.length === 0 ? true : Boolean(validation.data.isDefault)

      if (isDefault && existing.length > 0) {
        await tx
          .update(wallets)
          .set({ isDefault: false })
          .where(eq(wallets.userId, userId))
      }

      const [newWallet] = await tx
        .insert(wallets)
        .values({
          userId,
          name: validation.data.name,
          type: validation.data.type,
          accountNumber: validation.data.accountNumber ?? null,
          color: validation.data.color,
          icon: validation.data.icon,
          initialBalance: validation.data.initialBalance,
          isDefault
        })
        .returning()

      if (!newWallet) {
        throw new Error('Failed to insert wallet')
      }

      return newWallet
    })

    return {
      success: true,
      data: {
        ...createdWallet,
        balance: createdWallet.initialBalance
      }
    }
  } catch (error) {
    throwSafeServerError(error, {
      context: 'create wallet',
      fallbackMessage: 'Failed to create wallet'
    })
  }
})
