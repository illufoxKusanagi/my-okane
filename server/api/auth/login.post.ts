import { db } from '~~/server/db'
import { users } from '~~/server/db/schema'
import { eq } from 'drizzle-orm'
import { z } from 'zod'

import { checkRateLimit } from '~~/server/utils/rateLimiter'
import { throwSafeServerError } from '~~/server/utils/safeError'

const loginSchema = z.object({
  email: z.email('Invalid email address'),
  password: z.string().min(1, 'Password is required')
})

export default defineEventHandler(async (event) => {
  await checkRateLimit(event, {
    uniqueKey: 'auth_login',
    windowMs: 15 * 60 * 1000,
    limit: 5,
    message: 'Too many login attempts from this IP.'
  })

  const body = await readBody(event)

  const validation = loginSchema.safeParse(body)
  if (!validation.success) {
    throw createError({
      statusCode: 400,
      statusMessage: validation.error.issues[0]?.message || 'Validation failed'
    })
  }

  const { email, password } = validation.data

  try {
    const userResult = await db
      .select()
      .from(users)
      .where(eq(users.email, email.toLowerCase().trim()))
      .limit(1)

    const user = userResult[0]
    if (!user) {
      // Mitigate timing-based user enumeration with constant-time verification
      await verifyUserPassword(password, DUMMY_PASSWORD_HASH)
      throw createError({
        statusCode: 401,
        statusMessage: 'Invalid email or password'
      })
    }

    const match = await verifyUserPassword(password, user.passwordHash)
    if (!match) {
      throw createError({
        statusCode: 401,
        statusMessage: 'Invalid email or password'
      })
    }

    await setUserSession(event, {
      user: {
        id: user.id,
        name: user.name,
        email: user.email
      }
    })

    // Successful login: refund the attempt so only failures count toward the brute-force budget.
    await resetRateLimit(event, 'auth_login')

    return {
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email
      }
    }
  } catch (error: unknown) {
    throwSafeServerError(error, { context: 'login', fallbackMessage: 'Login failed' })
  }
})
