import { z } from 'zod'
import { eq } from 'drizzle-orm'
import { db } from '~~/server/db'
import { users } from '~~/server/db/schema'
import { checkRateLimit } from '~~/server/utils/rateLimiter'
import { throwSafeServerError } from '~~/server/utils/safeError'

const profileSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Name is required')
    .max(100, 'Name is too long')
})

export default defineEventHandler(async (event) => {
  await checkRateLimit(event, {
    uniqueKey: 'auth_profile',
    windowMs: 60 * 1000,
    limit: 10,
    message: 'Too many profile updates. Please try again shortly.'
  })

  const body = await readBody(event)
  const validation = profileSchema.safeParse(body)
  if (!validation.success) {
    throw createError({
      statusCode: 400,
      statusMessage: validation.error.issues[0]?.message || 'Validation failed'
    })
  }

  try {
    const userId = await getAuthUserId(event)
    const session = await getUserSession(event)

    const updated = await db
      .update(users)
      .set({ name: validation.data.name })
      .where(eq(users.id, userId))
      .returning()

    const user = updated[0]
    if (!user) {
      throw createError({
        statusCode: 404,
        statusMessage: 'User not found'
      })
    }

    if (session.user) {
      await setUserSession(event, {
        user: {
          ...session.user,
          name: user.name
        }
      } as unknown as Parameters<typeof setUserSession>[1])
    }

    return {
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email
      }
    }
  } catch (error: unknown) {
    throwSafeServerError(error, {
      context: 'update profile',
      fallbackMessage: 'Failed to update profile'
    })
  }
})
