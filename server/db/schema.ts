import { sqliteTable, text, integer, index } from 'drizzle-orm/sqlite-core'
import { sql } from 'drizzle-orm'
import { v7 as uuidv7 } from 'uuid'

export const users = sqliteTable('users', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => uuidv7()),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  resetTokenHash: text('reset_token_hash'),
  resetTokenExpiresAt: integer('reset_token_expires_at', {
    mode: 'timestamp'
  }),
  credentialsVersion: integer('credentials_version').notNull().default(0),
  periodStartDay: integer('period_start_day').notNull().default(1),
  createdAt: integer('created_at', { mode: 'timestamp' })
    .default(sql`(unixepoch())`)
    .notNull()
})

export const wallets = sqliteTable(
  'wallets',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: text('user_id')
      .references(() => users.id, { onDelete: 'cascade' })
      .notNull(),
    name: text('name').notNull(),
    type: text('type').notNull(), // 'bank' | 'cash' | 'ewallet' | 'savings' | 'credit'
    accountNumber: text('account_number'),
    color: text('color').default('emerald'),
    icon: text('icon').default('i-lucide-credit-card'),
    initialBalance: integer('initial_balance').notNull().default(0),
    isDefault: integer('is_default', { mode: 'boolean' }).notNull().default(false),
    createdAt: integer('created_at', { mode: 'timestamp' })
      .default(sql`(unixepoch())`)
      .notNull()
  },
  table => [index('wallets_user_id_idx').on(table.userId)]
)

export const transactions = sqliteTable(
  'transactions',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    name: text('transaction_name').notNull(),
    type: text('transaction_type').notNull(),
    amount: integer('amount').notNull(),
    notes: text('notes'),
    transactionDate: integer('transaction_date', { mode: 'timestamp' })
      .default(sql`(unixepoch())`)
      .notNull(),
    categoryId: text('category_id')
      .references(() => categories.id, { onDelete: 'cascade' })
      .notNull(),
    walletId: text('wallet_id').references(() => wallets.id, {
      onDelete: 'set null'
    }),
    transferWalletId: text('transfer_wallet_id').references(() => wallets.id, {
      onDelete: 'set null'
    }),
    userId: text('user_id')
      .references(() => users.id, { onDelete: 'cascade' })
      .notNull(),
    createdAt: integer('created_at', { mode: 'timestamp' })
      .default(sql`(unixepoch())`)
      .notNull()
  },
  table => [
    index('transactions_user_id_idx').on(table.userId),
    index('transactions_category_id_idx').on(table.categoryId),
    index('transactions_user_date_idx').on(table.userId, table.transactionDate),
    index('transactions_wallet_id_idx').on(table.walletId)
  ]
)

export const categories = sqliteTable(
  'categories',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    name: text('name').notNull(),
    type: text('type').notNull(),
    icon: text('icon').default('i-lucide-folder'),
    color: text('color').default('blue'),
    userId: text('user_id')
      .references(() => users.id, { onDelete: 'cascade' })
      .notNull()
  },
  table => [index('categories_user_id_idx').on(table.userId)]
)

export const budgets = sqliteTable(
  'budgets',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: text('user_id')
      .references(() => users.id, { onDelete: 'cascade' })
      .notNull(),
    categoryId: text('category_id').references(() => categories.id, {
      onDelete: 'cascade'
    }), // nullable for overall/global budget
    amount: integer('amount').notNull(),
    month: text('month').notNull(), // format 'YYYY-MM'
    createdAt: integer('created_at', { mode: 'timestamp' })
      .default(sql`(unixepoch())`)
      .notNull()
  },
  table => [
    index('budgets_user_id_idx').on(table.userId),
    index('budgets_user_month_idx').on(table.userId, table.month)
  ]
)

export type User = typeof users.$inferSelect
export type NewUser = typeof users.$inferInsert
export type Category = typeof categories.$inferSelect
export type Transaction = typeof transactions.$inferSelect
export type NewTransaction = typeof transactions.$inferInsert
export type NewCategory = typeof categories.$inferInsert
export type Budget = typeof budgets.$inferSelect
export type NewBudget = typeof budgets.$inferInsert
export type Wallet = typeof wallets.$inferSelect
export type NewWallet = typeof wallets.$inferInsert
