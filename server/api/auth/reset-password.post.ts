import { db } from '~~/server/db'
import { users } from '~~/server/db/schema'
import { and, eq } from 'drizzle-orm'
import { z } from 'zod'

import { checkRateLimit } from '~~/server/utils/rateLimiter'
import { throwSafeServerError } from '~~/server/utils/safeError'
import { hashUserPassword } from '~~/server/utils/password'
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
    // Rate limit inside try so 429s are tagged with Sentry context and handled
    // consistently with other errors.
    await checkRateLimit(event, {
      uniqueKey: 'auth_reset',
      windowMs: 15 * 60 * 1000,
      limit: 10,
      message: 'Too many password reset attempts from this IP.'
    })

    // Tokens are stored hashed (sha256); lookup is by hash, never by raw token.
    const tokenHash = sha256Hex(token)

    // Single-use guarantee: wrap in a transaction and re-verify the token hash
    // in the UPDATE WHERE clause so concurrent requests with the same token
    // cannot both succeed.
    const result = await db.transaction(async (tx) => {
      const userResult = await tx
        .select()
        .from(users)
        .where(eq(users.resetTokenHash, tokenHash))
        .limit(1)
      const user = userResult[0]

      // Unknown token and expired token return the same generic error.
      if (!user || isResetTokenExpired(user.resetTokenExpiresAt)) {
        throw invalidLinkError()
      }

      const passwordHash = await hashUserPassword(password)
      await tx
        .update(users)
        .set({
          passwordHash,
          // Single-use: clear the token in the same write as the password change.
          resetTokenHash: null,
          resetTokenExpiresAt: null,
          // Revokes every other session issued before this reset.
          credentialsVersion: (user.credentialsVersion ?? 0) + 1
        })
        .where(
          and(
            eq(users.id, user.id),
            eq(users.resetTokenHash, tokenHash)
          )
        )

      return { success: true, message: 'Password updated. You can now sign in.' }
    })

    return result
  } catch (error: unknown) {
    throwSafeServerError(error, {
      context: 'reset-password',
      fallbackMessage: 'Password reset failed'
    })
  }
})
