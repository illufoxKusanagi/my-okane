import { db } from '~~/server/db'
import { users } from '~~/server/db/schema'
import { eq } from 'drizzle-orm'
import { z } from 'zod'

import { checkRateLimit } from '~~/server/utils/rateLimiter'
import { throwSafeServerError } from '~~/server/utils/safeError'
import { passwordSchema } from '~~/server/utils/validator'
import {
  isResetTokenExpired,
  sha256Hex
} from '~~/server/utils/passwordReset'

const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Token is required').max(200, 'Token too long'),
  password: passwordSchema
})

export default defineEventHandler(async (event) => {
  await checkRateLimit(event, {
    uniqueKey: 'auth_reset',
    windowMs: 15 * 60 * 1000,
    limit: 10,
    message: 'Too many password reset attempts from this IP.'
  })

  const body = await readBody(event)
  const validation = resetPasswordSchema.safeParse(body)
  if (!validation.success) {
    throw createError({
      statusCode: 400,
      statusMessage: validation.error.issues[0]?.message || 'Validation failed'
    })
  }

  const { token, password } = validation.data
  const invalidLinkError = () =>
    createError({
      statusCode: 400,
      statusMessage: 'This reset link is invalid or has expired.'
    })

  try {
    // Tokens are stored hashed (sha256); lookup is by hash, never by raw token.
    const tokenHash = sha256Hex(token)
    const result = await db
      .select()
      .from(users)
      .where(eq(users.resetTokenHash, tokenHash))
      .limit(1)
    const user = result[0]

    // Unknown token and expired token return the same generic error.
    if (!user || isResetTokenExpired(user.resetTokenExpiresAt)) {
      throw invalidLinkError()
    }

    const passwordHash = await hashUserPassword(password)
    await db
      .update(users)
      .set({
        passwordHash,
        // Single-use: clear the token in the same write as the password change.
        resetTokenHash: null,
        resetTokenExpiresAt: null,
        // Revokes every other session issued before this reset.
        credentialsVersion: user.credentialsVersion + 1
      })
      .where(eq(users.id, user.id))

    return {
      success: true,
      message: 'Password updated. You can now sign in.'
    }
  } catch (error: unknown) {
    throwSafeServerError(error, {
      context: 'reset-password',
      fallbackMessage: 'Password reset failed'
    })
  }
})
