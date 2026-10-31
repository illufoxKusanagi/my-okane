import { z } from 'zod'
import { eq } from 'drizzle-orm'
import { db } from '~~/server/db'
import { users } from '~~/server/db/schema'
import { checkRateLimit } from '~~/server/utils/rateLimiter'
import { throwSafeServerError } from '~~/server/utils/safeError'

const profileSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(1, 'Name is required')
      .max(100, 'Name is too long')
      .optional(),
    periodStartDay: z
      .number()
      .int('Period start day must be an integer')
      .min(1, 'Period start day must be between 1 and 28')
      .max(28, 'Period start day must be between 1 and 28')
      .optional()
  })
  .refine(
    data => data.name !== undefined || data.periodStartDay !== undefined,
    { message: 'At least one field (name or periodStartDay) is required' }
  )

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

    const updatePayload: { name?: string, periodStartDay?: number } = {}
    if (validation.data.name !== undefined) {
      updatePayload.name = validation.data.name
    }
    if (validation.data.periodStartDay !== undefined) {
      updatePayload.periodStartDay = validation.data.periodStartDay
    }

    const updated = await db
      .update(users)
      .set(updatePayload)
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
          name: user.name,
          periodStartDay: user.periodStartDay
        }
      } as unknown as Parameters<typeof setUserSession>[1])
    }

    return {
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        periodStartDay: user.periodStartDay
      }
    }
  } catch (error: unknown) {
    throwSafeServerError(error, {
      context: 'update profile',
      fallbackMessage: 'Failed to update profile'
    })
  }
})
