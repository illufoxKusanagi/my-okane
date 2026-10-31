import { db } from '~~/server/db'
import { users } from '~~/server/db/schema'
import { eq } from 'drizzle-orm'
import { z } from 'zod'
import { createHash } from 'node:crypto'

import { checkRateLimit, resetRateLimit } from '~~/server/utils/rateLimiter'
import { throwSafeServerError } from '~~/server/utils/safeError'
import { passwordSchema } from '~~/server/utils/validator'
import { DUMMY_PASSWORD_HASH, verifyUserPassword } from '~~/server/utils/password'

const loginSchema = z.object({
  email: z.string().trim().email('Invalid email address').max(254, 'Email too long'),
  password: passwordSchema
})

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const validation = loginSchema.safeParse(body)
  if (!validation.success) {
    throw createError({
      statusCode: 400,
      statusMessage: validation.error.issues[0]?.message || 'Validation failed'
    })
  }

  const { email, password } = validation.data
  const normalizedEmail = email.toLowerCase().trim()
  const accountHash = createHash('sha256').update(normalizedEmail).digest('hex')

  try {
    // Both rate-limit buckets are checked before any user lookup / password
    // verification. Per-IP protects against request-frequency abuse; per-account
    // (keyed by SHA256 of normalized email) prevents distributed credential
    // stuffing via rotating proxies. Applied uniformly whether the account
    // exists or not, so it does not leak user existence.
    await checkRateLimit(event, {
      uniqueKey: 'auth_login',
      windowMs: 15 * 60 * 1000,
      limit: 5,
      message: 'Too many login attempts from this IP.'
    })
    await checkRateLimit(event, {
      uniqueKey: 'auth_login_account',
      windowMs: 60 * 60 * 1000,
      limit: 10,
      message: 'Too many login attempts for this account.',
      customKey: accountHash
    })

    const userResult = await db
      .select()
      .from(users)
      .where(eq(users.email, normalizedEmail))
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

    // Any outstanding reset token is now moot — the authenticated user has
    // proven possession of the current password.
    await db
      .update(users)
      .set({ resetTokenHash: null, resetTokenExpiresAt: null })
      .where(eq(users.id, user.id))

    // credentialsVersion is consumed by server/middleware/auth.ts to revoke
    // sessions after a password reset.
    await setUserSession(event, {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        credentialsVersion: user.credentialsVersion ?? 0,
        periodStartDay: user.periodStartDay ?? 1
      }
    } as unknown as Parameters<typeof setUserSession>[1])

    // Successful login: refund both buckets so only failures count toward the brute-force budget.
    await resetRateLimit(event, 'auth_login')
    await resetRateLimit(event, 'auth_login_account', accountHash)

    return {
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        periodStartDay: user.periodStartDay ?? 1
      }
    }
  } catch (error: unknown) {
    throwSafeServerError(error, {
      context: 'login',
      fallbackMessage: 'Login failed'
    })
  }
})
