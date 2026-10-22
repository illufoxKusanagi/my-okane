import { db } from '~~/server/db'
import { users } from '~~/server/db/schema'
import { eq } from 'drizzle-orm'
import { z } from 'zod'
import * as Sentry from '@sentry/nuxt'

import { checkRateLimit } from '~~/server/utils/rateLimiter'
import {
  generateResetToken,
  resetTokenExpiresAt,
  sha256Hex
} from '~~/server/utils/passwordReset'
import { sendPasswordResetEmail } from '~~/server/utils/emailClient'

const forgotPasswordSchema = z.object({
  email: z.email('Invalid email address')
})

export default defineEventHandler(async (event) => {
  await checkRateLimit(event, {
    uniqueKey: 'auth_forgot',
    windowMs: 15 * 60 * 1000,
    limit: 5,
    message: 'Too many password reset requests from this IP.'
  })

  const body = await readBody(event)
  const validation = forgotPasswordSchema.safeParse(body)
  if (!validation.success) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid email address'
    })
  }

  const email = validation.data.email.toLowerCase().trim()

  // Second bucket keyed by hashed email: caps how often one address can be
  // mail-bombed from a single IP regardless of which account is targeted.
  await checkRateLimit(event, {
    uniqueKey: `auth_forgot:${sha256Hex(email)}`,
    windowMs: 60 * 60 * 1000,
    limit: 3,
    message: 'Too many password reset requests for this account.'
  })

  // Identical body/status for every outcome — never reveals account existence.
  const uniformResponse = () => ({
    success: true,
    message:
      'If an account exists for that email, a password reset link has been sent.'
  })

  try {
    const result = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1)
    const user = result[0]

    if (!user) {
      // Timing pad: perform comparable hashing work on the miss path.
      sha256Hex(generateResetToken())
      return uniformResponse()
    }

    // Overwrite-on-request: a new request always invalidates the previous token.
    const token = generateResetToken()
    await db
      .update(users)
      .set({
        resetTokenHash: sha256Hex(token),
        resetTokenExpiresAt: resetTokenExpiresAt()
      })
      .where(eq(users.id, user.id))

    // Never throws; delivery failures are logged + alerted, response unchanged.
    await sendPasswordResetEmail(user.email, token)

    return uniformResponse()
  } catch (error: unknown) {
    // A 5xx here would let attackers distinguish existing accounts by failure
    // rate — swallow into the uniform response and alert via Sentry instead.
    console.error('[auth] forgot-password failed:', error)
    Sentry.captureException(error, {
      tags: { feature: 'password-reset' }
    })
    return uniformResponse()
  }
})
