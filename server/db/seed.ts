import 'dotenv/config'
import { drizzle } from 'drizzle-orm/libsql'
import { createClient } from '@libsql/client'
import { budgets, categories, transactions, users } from './schema'
import { hashUserPassword } from '../utils/password'
import { SEED_CATEGORIES, SEED_TRANSACTIONS } from './seedData'

const url = process.env.TURSO_DATABASE_URL || ''
const authToken = process.env.TURSO_AUTH_TOKEN

const client = createClient({
  url,
  authToken
})

const db = drizzle({ client })

async function main() {
  console.log('Seeding database...')

  console.log('Clearing existing data...')
  await db.delete(transactions)
  await db.delete(budgets)
  await db.delete(categories)
  await db.delete(users)

  console.log('Creating default user...')
  const passwordHash = await hashUserPassword('defaultpassword123')
  const userResult = await db
    .insert(users)
    .values({
      name: 'Default User',
      email: 'default@myokane.com',
      passwordHash
    })
    .returning()
  const defaultUser = userResult[0]
  if (!defaultUser) {
    throw new Error('Failed to create default user')
  }
  const defaultUserId = defaultUser.id

  console.log('Inserting categories...')
  const insertedCats = await db
    .insert(categories)
    .values(SEED_CATEGORIES.map(cat => ({ ...cat, userId: defaultUserId })))
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
    userId: defaultUserId
  }))

  console.log('Inserting transactions...')
  await db.insert(transactions).values(initialTransactions)

  console.log('Database seeded successfully!')
  process.exit(0)
}

main().catch((err) => {
  console.error('Seeding failed:', err)
  process.exit(1)
})
