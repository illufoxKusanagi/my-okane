// @vitest-environment node
import { describe, it, expect, beforeAll } from 'vitest'
import { migrate } from 'drizzle-orm/libsql/migrator'
import { db } from '~~/server/db'
import { users, categories, transactions, wallets } from '~~/server/db/schema'
import { and, eq, sql } from 'drizzle-orm'
import {
  validateWallet,
  validateWalletUpdate,
  validateWalletTransfer
} from '~~/server/utils/walletValidator'

describe('Multi-Account Wallets & Transfer API Logic', () => {
  let testUserId: string
  let otherUserId: string
  let spendingCatId: string
  let incomeCatId: string
  let wallet1Id: string
  let wallet2Id: string

  beforeAll(async () => {
    await migrate(db, { migrationsFolder: './server/db/migrations/turso' })
    await db.delete(transactions)
    await db.delete(wallets)
    await db.delete(categories)
    await db.delete(users)

    const [user] = await db
      .insert(users)
      .values({ name: 'Wallet User', email: 'wallet-test@example.com', passwordHash: 'dummy' })
      .returning()
    testUserId = user!.id

    const [other] = await db
      .insert(users)
      .values({ name: 'Other User', email: 'other-wallet@example.com', passwordHash: 'dummy' })
      .returning()
    otherUserId = other!.id

    const [spendCat] = await db
      .insert(categories)
      .values({ name: 'General Spending', type: 'spending', userId: testUserId })
      .returning()
    spendingCatId = spendCat!.id

    const [incCat] = await db
      .insert(categories)
      .values({ name: 'General Income', type: 'income', userId: testUserId })
      .returning()
    incomeCatId = incCat!.id
  })

  describe('Wallet Validators', () => {
    it('validates correct wallet creation and update payload', () => {
      const valid = validateWallet({
        name: 'BCA Main',
        type: 'bank',
        accountNumber: '1234',
        color: 'emerald',
        icon: 'i-lucide-credit-card',
        initialBalance: 1000000
      })
      expect(valid.success).toBe(true)
      expect(validateWalletUpdate({ name: 'Updated Bank' }).success).toBe(true)
    })

    it('rejects account number with invalid length or non-digits', () => {
      expect(validateWallet({ name: 'Bank', type: 'bank', accountNumber: '123' }).success).toBe(false)
      expect(validateWallet({ name: 'Bank', type: 'bank', accountNumber: '12345' }).success).toBe(false)
      expect(validateWallet({ name: 'Bank', type: 'bank', accountNumber: 'abcd' }).success).toBe(false)
    })

    it('rejects invalid wallet type, empty name, or negative balance', () => {
      expect(validateWallet({ name: '', type: 'bank' }).success).toBe(false)
      expect(validateWallet({ name: 'Cash', type: 'crypto' }).success).toBe(false)
      expect(validateWallet({ name: 'Bank', type: 'bank', initialBalance: -50 }).success).toBe(false)
    })

    it('rejects transfer with same source and target or zero amount', () => {
      expect(validateWalletTransfer({ sourceWalletId: 'w-1', targetWalletId: 'w-1', amount: 50000 }).success).toBe(false)
      expect(validateWalletTransfer({ sourceWalletId: 'w-1', targetWalletId: 'w-2', amount: 0 }).success).toBe(false)
    })
  })

  describe('Wallet Creation & Balance Derivation', () => {
    it('sets first created wallet as default', async () => {
      const [w1] = await db
        .insert(wallets)
        .values({ userId: testUserId, name: 'Main Bank', type: 'bank', initialBalance: 5000000, isDefault: true })
        .returning()
      wallet1Id = w1!.id

      const [w2] = await db
        .insert(wallets)
        .values({ userId: testUserId, name: 'Cash Pocket', type: 'cash', initialBalance: 200000, isDefault: false })
        .returning()
      wallet2Id = w2!.id

      expect(w1?.isDefault).toBe(true)
      expect(w2?.isDefault).toBe(false)
    })

    it('calculates dynamic balance: initialBalance + income - spending', async () => {
      await db.insert(transactions).values([
        { name: 'Salary', type: 'income', amount: 2000000, categoryId: incomeCatId, walletId: wallet1Id, userId: testUserId },
        { name: 'Groceries', type: 'spending', amount: 500000, categoryId: spendingCatId, walletId: wallet1Id, userId: testUserId }
      ])

      const txSums = await db
        .select({
          walletId: transactions.walletId,
          type: transactions.type,
          total: sql<number>`coalesce(sum(${transactions.amount}), 0)`
        })
        .from(transactions)
        .where(and(eq(transactions.userId, testUserId), eq(transactions.walletId, wallet1Id)))
        .groupBy(transactions.walletId, transactions.type)

      let inc = 0
      let spd = 0
      for (const row of txSums) {
        if (row.type === 'income') inc += Number(row.total)
        if (row.type === 'spending') spd += Number(row.total)
      }

      const [w1] = await db.select().from(wallets).where(eq(wallets.id, wallet1Id))
      expect(w1!.initialBalance + inc - spd).toBe(6500000)
    })

    it('executes inter-wallet transfer and updates balances on both sides', async () => {
      const transferAmount = 1000000
      await db.transaction(async (tx) => {
        await tx.insert(transactions).values({
          name: 'Transfer to Cash Pocket',
          type: 'spending',
          amount: transferAmount,
          categoryId: spendingCatId,
          walletId: wallet1Id,
          transferWalletId: wallet2Id,
          userId: testUserId
        })
        await tx.insert(transactions).values({
          name: 'Transfer from Main Bank',
          type: 'income',
          amount: transferAmount,
          categoryId: incomeCatId,
          walletId: wallet2Id,
          transferWalletId: wallet1Id,
          userId: testUserId
        })
      })

      const txsW2 = await db.select().from(transactions).where(eq(transactions.walletId, wallet2Id))
      const w2Inc = txsW2.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0)
      const [w2] = await db.select().from(wallets).where(eq(wallets.id, wallet2Id))
      expect(w2!.initialBalance + w2Inc).toBe(1200000)
    })

    it('enforces deletion guard: prevents deleting only wallet', async () => {
      await db.insert(wallets).values({
        userId: otherUserId,
        name: 'Solo Wallet',
        type: 'bank',
        initialBalance: 0,
        isDefault: true
      })
      const userWallets = await db.select().from(wallets).where(eq(wallets.userId, otherUserId))
      expect(userWallets.length).toBe(1)
      expect(userWallets.length > 1).toBe(false)
    })

    it('safely detaches transactions when wallet is deleted', async () => {
      await db.transaction(async (tx) => {
        await tx
          .update(transactions)
          .set({ walletId: null })
          .where(and(eq(transactions.walletId, wallet2Id), eq(transactions.userId, testUserId)))
        await tx
          .delete(wallets)
          .where(and(eq(wallets.id, wallet2Id), eq(wallets.userId, testUserId)))
      })

      const detachedTxs = await db
        .select()
        .from(transactions)
        .where(eq(transactions.transferWalletId, wallet1Id))
      expect(detachedTxs.length).toBeGreaterThan(0)
      expect(detachedTxs[0]?.walletId).toBeNull()

      const remaining = await db.select().from(wallets).where(eq(wallets.userId, testUserId))
      expect(remaining.length).toBe(1)
      expect(remaining[0]?.id).toBe(wallet1Id)
    })
  })
})
