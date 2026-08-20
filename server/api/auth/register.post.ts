import { db } from '~~/server/db'
import { users, categories } from '~~/server/db/schema'
import { eq } from 'drizzle-orm'
import { z } from 'zod'
import * as Sentry from '@sentry/nuxt'

import { checkRateLimit } from '~~/server/utils/rateLimiter'

const registerSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters')
})

export default defineEventHandler(async (event) => {
  checkRateLimit(event, {
    uniqueKey: 'auth_register',
    windowMs: 60 * 60 * 1000,
    limit: 3,
    message: 'Too many registration attempts from this IP.'
  })

  const body = await readBody(event)

  const validation = registerSchema.safeParse(body)
  if (!validation.success) {
    throw createError({
      statusCode: 400,
      statusMessage: validation.error.issues[0]?.message || 'Validation failed'
    })
  }

  const { name, email, password } = validation.data

  try {
    const existing = await db
      .select()
      .from(users)
      .where(eq(users.email, email.toLowerCase().trim()))
      .limit(1)

    if (existing.length > 0) {
      throw createError({
        statusCode: 409,
        statusMessage: 'Email address is already registered'
      })
    }

    const passwordHash = hashUserPassword(password)

    const newUser = await db.transaction(async (tx) => {
      const userResult = await tx
        .insert(users)
        .values({
          name,
          email: email.toLowerCase().trim(),
          passwordHash
        })
        .returning()

      const createdUser = userResult[0]
      if (!createdUser) {
        throw createError({
          statusCode: 500,
          statusMessage: 'Registration failed: User could not be created'
        })
      }

      const defaultCategories = [
        {
          name: 'Food',
          type: 'spending',
          icon: 'i-lucide-utensils',
          color: 'amber',
          userId: createdUser.id
        },
        {
          name: 'Transport',
          type: 'spending',
          icon: 'i-lucide-car',
          color: 'blue',
          userId: createdUser.id
        },
        {
          name: 'Utilities',
          type: 'spending',
          icon: 'i-lucide-lightbulb',
          color: 'yellow',
          userId: createdUser.id
        },
        {
          name: 'Entertainment',
          type: 'spending',
          icon: 'i-lucide-film',
          color: 'purple',
          userId: createdUser.id
        },
        {
          name: 'Shopping',
          type: 'spending',
          icon: 'i-lucide-shopping-bag',
          color: 'pink',
          userId: createdUser.id
        },
        {
          name: 'Others',
          type: 'spending',
          icon: 'i-lucide-circle-help',
          color: 'slate',
          userId: createdUser.id
        },
        {
          name: 'Salary',
          type: 'income',
          icon: 'i-lucide-wallet',
          color: 'emerald',
          userId: createdUser.id
        },
        {
          name: 'Freelance',
          type: 'income',
          icon: 'i-lucide-briefcase',
          color: 'cyan',
          userId: createdUser.id
        },
        {
          name: 'Investments',
          type: 'income',
          icon: 'i-lucide-trending-up',
          color: 'indigo',
          userId: createdUser.id
        },
        {
          name: 'Others',
          type: 'income',
          icon: 'i-lucide-circle-help',
          color: 'slate',
          userId: createdUser.id
        }
      ]

      await tx.insert(categories).values(defaultCategories)
      return createdUser
    })

    await setUserSession(event, {
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email
      }
    })

    return {
      success: true,
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email
      }
    }
  } catch (error: unknown) {
    console.error('Registration error:', error)
    Sentry.captureException(error)
    if (typeof error === 'object' && error !== null && 'statusCode' in error) throw error
    throw createError({
      statusCode: 500,
      statusMessage: 'Registration failed',
      data: {
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      }
    })
  }
})
