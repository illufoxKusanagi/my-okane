import { db } from '~~/server/db'
import { wallets, transactions } from '~~/server/db/schema'
import { and, asc, desc, eq, isNotNull, sql } from 'drizzle-orm'
import { throwSafeServerError } from '~~/server/utils/safeError'

export default defineEventHandler(async (event) => {
  try {
    const userId = await getAuthUserId(event)

    const userWallets = await db
      .select()
      .from(wallets)
      .where(eq(wallets.userId, userId))
      .orderBy(desc(wallets.isDefault), asc(wallets.createdAt))

    if (userWallets.length === 0) {
      return {
        success: true,
        data: []
      }
    }

    // Aggregate income and spending per wallet for this user
    const txSums = await db
      .select({
        walletId: transactions.walletId,
        type: transactions.type,
        total: sql<number>`coalesce(sum(${transactions.amount}), 0)`
      })
      .from(transactions)
      .where(and(eq(transactions.userId, userId), isNotNull(transactions.walletId)))
      .groupBy(transactions.walletId, transactions.type)

    const incomeMap = new Map<string, number>()
    const spendingMap = new Map<string, number>()

    for (const row of txSums) {
      if (!row.walletId) continue
      const amount = Number(row.total) || 0
      if (row.type === 'income') {
        incomeMap.set(row.walletId, (incomeMap.get(row.walletId) ?? 0) + amount)
      } else if (row.type === 'spending') {
        spendingMap.set(row.walletId, (spendingMap.get(row.walletId) ?? 0) + amount)
      }
    }

    const walletsWithBalance = userWallets.map((wallet) => {
      const income = incomeMap.get(wallet.id) ?? 0
      const spending = spendingMap.get(wallet.id) ?? 0
      const balance = wallet.initialBalance + income - spending
      return {
        ...wallet,
        balance
      }
    })

    return {
      success: true,
      data: walletsWithBalance
    }
  } catch (error) {
    throwSafeServerError(error, {
      context: 'fetch wallets',
      fallbackMessage: 'Failed to fetch wallets'
    })
  }
})
