import { drizzle } from 'drizzle-orm/libsql'
import { createClient } from '@libsql/client'
import { inArray } from 'drizzle-orm'
import { budgets, categories, transactions, users, wallets } from './schema'
import { hashUserPassword } from '../utils/password'
import { SEED_CATEGORIES, SEED_TRANSACTIONS } from './seedData'

// Local dev database only. Production accounts are created manually
// via /register — seeding never touches the remote Turso database.
if (process.env.NODE_ENV === 'production') {
  console.error(
    'FATAL: Database seeding is strictly forbidden in production or against remote databases!'
  )
  process.exit(1)
}

const url = 'file:local.dev.db'

const client = createClient({ url })

const db = drizzle({ client })

const SEED_PASSWORD = 'defaultpassword123'
const SEED_USERS = [
  { name: 'Default User', email: 'default@myokane.com' },
  { name: 'Alice', email: 'alice@myokane.com' },
  { name: 'Bob', email: 'bob@myokane.com' }
]

const SEED_WALLETS = [
  {
    name: 'BCA Debit',
    type: 'bank',
    accountNumber: '8839',
    color: 'emerald',
    icon: 'i-lucide-credit-card',
    initialBalance: 5000000,
    isDefault: true
  },
  {
    name: 'GoPay',
    type: 'ewallet',
    accountNumber: '6789',
    color: 'cyan',
    icon: 'i-lucide-wallet',
    initialBalance: 500000,
    isDefault: false
  },
  {
    name: 'Emergency Savings',
    type: 'savings',
    accountNumber: '1102',
    color: 'indigo',
    icon: 'i-lucide-landmark',
    initialBalance: 20000000,
    isDefault: false
  }
]

async function clearPreviousSeedUsers() {
  const emails = SEED_USERS.map(u => u.email)
  const existing = await db
    .select({ id: users.id })
    .from(users)
    .where(inArray(users.email, emails))
  const ids = existing.map(r => r.id)
  if (ids.length === 0) return
  await db.delete(transactions).where(inArray(transactions.userId, ids))
  await db.delete(budgets).where(inArray(budgets.userId, ids))
  await db.delete(categories).where(inArray(categories.userId, ids))
  await db.delete(wallets).where(inArray(wallets.userId, ids))
  await db.delete(users).where(inArray(users.id, ids))
}

async function main() {
  console.log(`Seeding local (${url})...`)

  console.log(
    'Clearing previous seed users (scoped, non-seed users untouched)...'
  )
  await clearPreviousSeedUsers()

  const passwordHash = await hashUserPassword(SEED_PASSWORD)

  for (const seedUser of SEED_USERS) {
    const [user] = await db
      .insert(users)
      .values({ name: seedUser.name, email: seedUser.email, passwordHash })
      .returning()
    if (!user) {
      throw new Error(`Failed to create ${seedUser.email}`)
    }

    const insertedCats = await db
      .insert(categories)
      .values(SEED_CATEGORIES.map(cat => ({ ...cat, userId: user.id })))
      .returning()

    const insertedWallets = await db
      .insert(wallets)
      .values(SEED_WALLETS.map(w => ({ ...w, userId: user.id })))
      .returning()

    const defaultWallet = insertedWallets.find(w => w.isDefault) ?? insertedWallets[0]

    const catMap = new Map<string, string>()
    for (const cat of insertedCats) {
      catMap.set(`${cat.name}:${cat.type}`, cat.id)
    }

    const getCatId = (name: string, type: string): string => {
      const id = catMap.get(`${name}:${type}`)
      if (id === undefined) {
        throw new Error(`Category not found: ${name} (${type})`)
      }
      return id
    }

    const initialTransactions = SEED_TRANSACTIONS.map(tx => ({
      name: tx.name,
      type: tx.type,
      amount: tx.amount,
      notes: tx.notes,
      transactionDate: tx.transactionDate,
      categoryId: getCatId(tx.category.name, tx.category.type),
      walletId: defaultWallet?.id,
      userId: user.id
    }))

    await db.insert(transactions).values(initialTransactions)

    console.log(
      `  ${seedUser.email}: 1 user, ${insertedWallets.length} wallets, ${insertedCats.length} categories, ${initialTransactions.length} transactions`
    )
  }

  console.log(`Database seeded: ${SEED_USERS.length} users on local (${url})`)
  process.exit(0)
}

main().catch((err) => {
  console.error('Seeding failed:', err)
  process.exit(1)
})
