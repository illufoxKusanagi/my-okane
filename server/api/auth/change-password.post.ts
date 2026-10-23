import { z } from 'zod'
import { eq } from 'drizzle-orm'
import { db } from '~~/server/db'
import { users } from '~~/server/db/schema'
import { checkRateLimit } from '~~/server/utils/rateLimiter'
import { throwSafeServerError } from '~~/server/utils/safeError'
import { passwordSchema } from '~~/server/utils/validator'
import { hashUserPassword, verifyUserPassword } from '~~/server/utils/password'

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: passwordSchema
})

export default defineEventHandler(async (event) => {
  await checkRateLimit(event, {
    uniqueKey: 'auth_change_password',
    windowMs: 15 * 60 * 1000,
    limit: 5,
    message: 'Too many password change attempts. Please try again later.'
  })

  const body = await readBody(event)
  const validation = changePasswordSchema.safeParse(body)
  if (!validation.success) {
    throw createError({
      statusCode: 400,
      statusMessage: validation.error.issues[0]?.message || 'Validation failed'
    })
  }

  const { currentPassword, newPassword } = validation.data

  try {
    const userId = await getAuthUserId(event)
    const session = await getUserSession(event)

    const rows = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1)

    const user = rows[0]
    if (!user) {
      throw createError({
        statusCode: 404,
        statusMessage: 'User not found'
      })
    }

    const match = await verifyUserPassword(currentPassword, user.passwordHash)
    if (!match) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Incorrect current password'
      })
    }

    if (currentPassword === newPassword) {
      throw createError({
        statusCode: 400,
        statusMessage:
          'New password cannot be the same as your current password'
      })
    }

    const passwordHash = await hashUserPassword(newPassword)
    const nextVersion = (user.credentialsVersion ?? 0) + 1

    await db
      .update(users)
      .set({
        passwordHash,
        resetTokenHash: null,
        resetTokenExpiresAt: null,
        credentialsVersion: nextVersion
      })
      .where(eq(users.id, user.id))

    if (session.user) {
      await setUserSession(event, {
        user: {
          ...session.user,
          credentialsVersion: nextVersion
        }
      } as Parameters<typeof setUserSession>[1])
    }

    return {
      success: true,
      message: 'Password changed successfully.'
    }
  } catch (error: unknown) {
    throwSafeServerError(error, {
      context: 'change password',
      fallbackMessage: 'Failed to change password'
    })
  }
})
