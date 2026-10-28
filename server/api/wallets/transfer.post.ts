import { db } from '~~/server/db'
import { wallets, transactions, categories } from '~~/server/db/schema'
import { and, eq, inArray } from 'drizzle-orm'
import { validateWalletTransfer } from '~~/server/utils/walletValidator'
import { throwSafeServerError } from '~~/server/utils/safeError'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const validation = validateWalletTransfer(body)

  if (!validation.success) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Validation failed',
      data: validation.error.issues
    })
  }

  try {
    const userId = await getAuthUserId(event)

    await db.transaction(async (tx) => {
      const userWallets = await tx
        .select()
        .from(wallets)
        .where(
          and(
            eq(wallets.userId, userId),
            inArray(wallets.id, [
              validation.data.sourceWalletId,
              validation.data.targetWalletId
            ])
          )
        )

      const sourceWallet = userWallets.find(
        w => w.id === validation.data.sourceWalletId
      )
      const targetWallet = userWallets.find(
        w => w.id === validation.data.targetWalletId
      )

      if (!sourceWallet || !targetWallet) {
        throw createError({
          statusCode: 404,
          statusMessage:
            'Source or target wallet not found or does not belong to the user'
        })
      }

      // Fetch or ensure categories for transfer
      const userCategories = await tx
        .select()
        .from(categories)
        .where(eq(categories.userId, userId))

      let spendingCatId = userCategories.find(
        c =>
          c.type === 'spending'
          && (c.name.toLowerCase() === 'transfer' || c.name.toLowerCase() === 'others')
      )?.id ?? userCategories.find(c => c.type === 'spending')?.id

      if (!spendingCatId) {
        const [createdCat] = await tx
          .insert(categories)
          .values({
            name: 'Transfer',
            type: 'spending',
            icon: 'i-lucide-arrow-right-left',
            color: 'slate',
            userId
          })
          .returning()
        if (!createdCat) throw new Error('Failed to create spending category')
        spendingCatId = createdCat.id
      }

      let incomeCatId = userCategories.find(
        c =>
          c.type === 'income'
          && (c.name.toLowerCase() === 'transfer' || c.name.toLowerCase() === 'others')
      )?.id ?? userCategories.find(c => c.type === 'income')?.id

      if (!incomeCatId) {
        const [createdCat] = await tx
          .insert(categories)
          .values({
            name: 'Transfer',
            type: 'income',
            icon: 'i-lucide-arrow-right-left',
            color: 'slate',
            userId
          })
          .returning()
        if (!createdCat) throw new Error('Failed to create income category')
        incomeCatId = createdCat.id
      }

      const txDate = validation.data.date ?? new Date()

      // Outgoing transaction
      await tx.insert(transactions).values({
        name: `Transfer to ${targetWallet.name}`,
        type: 'spending',
        amount: validation.data.amount,
        categoryId: spendingCatId,
        walletId: sourceWallet.id,
        transferWalletId: targetWallet.id,
        notes: validation.data.notes ?? `Transfer to ${targetWallet.name}`,
        transactionDate: txDate,
        userId
      })

      // Incoming transaction
      await tx.insert(transactions).values({
        name: `Transfer from ${sourceWallet.name}`,
        type: 'income',
        amount: validation.data.amount,
        categoryId: incomeCatId,
        walletId: targetWallet.id,
        transferWalletId: sourceWallet.id,
        notes: validation.data.notes ?? `Transfer from ${sourceWallet.name}`,
        transactionDate: txDate,
        userId
      })
    })

    return {
      success: true,
      message: 'Transfer successful',
      data: {
        sourceWalletId: validation.data.sourceWalletId,
        targetWalletId: validation.data.targetWalletId,
        amount: validation.data.amount
      }
    }
  } catch (error) {
    throwSafeServerError(error, {
      context: 'wallet transfer',
      fallbackMessage: 'Failed to process transfer'
    })
  }
})
