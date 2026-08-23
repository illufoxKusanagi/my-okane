import * as Sentry from '@sentry/nuxt'
import { createError } from 'h3'

export interface ServerErrorClass {
  kind: 'conflict' | 'unavailable'
}

export interface SafeServerErrorOptions {
  /** Short label used in server-side logs, e.g. 'update transaction'. */
  context: string
  /** User-facing message when the failure cannot be classified. */
  fallbackMessage: string
  /** User-facing message for unique-constraint violations (e.g. register race). */
  conflictMessage?: string
}

const UNIQUE_PATTERNS = [
  /unique constraint failed/i,
  /sqlite_constraint/i,
  /duplicate entry/i,
  /already exists/i
]

const TRANSIENT_PATTERNS = [
  /sqlite_busy/i,
  /database is locked/i,
  /database table is locked/i,
  /connection refused/i,
  /econnrefused/i,
  /etimedout/i,
  /enotfound/i,
  /fetch failed/i,
  /socket connection was closed/i,
  /too many open files/i,
  /\b503\b/
]

export const TRANSIENT_ERROR_MESSAGE
  = 'The service is temporarily unavailable. Please try again shortly.'
export const DEFAULT_CONFLICT_MESSAGE = 'This record already exists.'

/**
 * Best-effort classification of an unknown upstream error into a safe,
 * user-presentable category. Returns null when the error matches nothing
 * known, in which case the caller's fallback message should be shown.
 */
export function classifyServerError(error: unknown): ServerErrorClass | null {
  const rawMessage = error instanceof Error ? error.message : String(error)
  if (!rawMessage) return null

  if (UNIQUE_PATTERNS.some(pattern => pattern.test(rawMessage))) {
    return { kind: 'conflict' }
  }
  if (TRANSIENT_PATTERNS.some(pattern => pattern.test(rawMessage))) {
    return { kind: 'unavailable' }
  }
  return null
}

function isHttpError(error: unknown): boolean {
  return (
    typeof error === 'object'
    && error !== null
    && 'statusCode' in error
    && typeof (error as { statusCode?: unknown }).statusCode === 'number'
  )
}

/**
 * Uniform handler for unexpected server errors:
 * 1. rethrows H3 errors untouched (4xx validation/409 flows stay intact),
 * 2. logs full details server-side,
 * 3. reports to Sentry and keeps the event id as a user-quotable reference,
 * 4. throws a sanitized 500 whose body contains only a friendly statusMessage
 *    and `data.referenceId` — never stacks or upstream messages.
 */
export function throwSafeServerError(
  error: unknown,
  options: SafeServerErrorOptions
): never {
  if (isHttpError(error)) throw error

  console.error(
    `[${options.context}] unexpected failure:`,
    error instanceof Error ? error.stack : error
  )
  const eventId = Sentry.captureException(error, {
    tags: { error_context: options.context }
  })

  let statusMessage = options.fallbackMessage
  const classified = classifyServerError(error)
  if (classified?.kind === 'unavailable') {
    statusMessage = TRANSIENT_ERROR_MESSAGE
  } else if (classified?.kind === 'conflict') {
    statusMessage = options.conflictMessage || DEFAULT_CONFLICT_MESSAGE
  }

  throw createError({
    statusCode: 500,
    statusMessage,
    data: eventId ? { referenceId: eventId } : undefined
  })
}
