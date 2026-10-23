import { drizzle } from 'drizzle-orm/libsql'
import { createClient } from '@libsql/client'
import { inArray } from 'drizzle-orm'
import { budgets, categories, transactions, users } from './schema'
import { hashUserPassword } from '../utils/password'
import { SEED_CATEGORIES, SEED_TRANSACTIONS } from './seedData'

// Local dev database only. Production accounts are created manually
// via /register — seeding never touches the remote Turso database.
if (
  process.env.NODE_ENV === 'production'
  || (process.env.TURSO_DATABASE_URL && !process.env.TURSO_DATABASE_URL.startsWith('file:'))
  || (process.env.DATABASE_URL && !process.env.DATABASE_URL.startsWith('file:'))
) {
  console.error('FATAL: Database seeding is strictly forbidden in production or against remote databases!')
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
  await db.delete(users).where(inArray(users.id, ids))
}

async function main() {
  console.log(`Seeding local (${url})...`)

  console.log('Clearing previous seed users (scoped, non-seed users untouched)...')
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

    const catMap = new Map<string, number>()
    for (const cat of insertedCats) {
      catMap.set(`${cat.name}:${cat.type}`, cat.id)
    }

    const getCatId = (name: string, type: string): number => {
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
      userId: user.id
    }))

    await db.insert(transactions).values(initialTransactions)

    console.log(
      `  ${seedUser.email}: 1 user, ${insertedCats.length} categories, ${initialTransactions.length} transactions`
    )
  }

  console.log(`Database seeded: ${SEED_USERS.length} users on local (${url})`)
  process.exit(0)
}

main().catch((err) => {
  console.error('Seeding failed:', err)
  process.exit(1)
})
