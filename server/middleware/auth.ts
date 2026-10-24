import { checkRateLimit } from '~~/server/utils/rateLimiter'
import { db } from '~~/server/db'
import { users } from '~~/server/db/schema'
import { eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const path = event.path

  if (path.startsWith('/api/')) {
    await checkRateLimit(event, {
      uniqueKey: 'global_api_ddos',
      windowMs: 60000,
      limit: 100,
      message: 'DDoS protection: Too many requests.'
    })

    const isPublicRoute
      = path.startsWith('/api/auth/login')
        || path.startsWith('/api/auth/register')
        || path.startsWith('/api/auth/logout')
        || path.startsWith('/api/auth/forgot-password')
        || path.startsWith('/api/auth/reset-password')
        || path.startsWith('/api/_auth/')
        || path.startsWith('/api/_nuxt_icon/')

    if (!isPublicRoute) {
      const session = await requireUserSession(event)
      const userId = session.user?.id

      if (typeof userId !== 'string' || !userId) {
        await clearUserSession(event)
        throw createError({
          statusCode: 401,
          statusMessage: 'Session invalid. Please sign in again.'
        })
      }

      // Session revocation: a password reset bumps credentialsVersion, so
      // any session signed with an older version is invalid. Fails closed
      // on database errors (request rejects rather than trusting a stale session).
      const rows = await db
        .select({ credentialsVersion: users.credentialsVersion })
        .from(users)
        .where(eq(users.id, userId))
        .limit(1)
      const currentVersion = rows[0]?.credentialsVersion ?? 0
      const sessionVersion = session.user.credentialsVersion ?? 0

      if (currentVersion !== sessionVersion) {
        await clearUserSession(event)
        throw createError({
          statusCode: 401,
          statusMessage: 'Session expired. Please sign in again.'
        })
      }
    }
  }
})
