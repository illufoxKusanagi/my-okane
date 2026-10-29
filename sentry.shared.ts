import type { Event, EventHint } from '@sentry/nuxt'
import { scrubResetTokens } from './sentry.scrub'

export const SENTRY_IGNORE_ERRORS: (string | RegExp)[] = [
  /^AbortError/,
  'Non-Error promise rejection captured',
  /ResizeObserver loop/,
  /Load failed$/,
  /Failed to fetch dynamically imported module/
]

const EXTENSION_PREFIXES = [
  'chrome-extension://',
  'moz-extension://',
  'safari-extension://',
  'safari-web-extension://'
]

const EXPECTED_HTTP_STATUSES = new Set([400, 401, 403, 404, 409, 422, 429])

interface StackFrameLike {
  filename?: string
}

interface ExceptionLike {
  stacktrace?: {
    frames?: StackFrameLike[]
  }
}

interface EventLike {
  exception?: {
    values?: ExceptionLike[]
  }
}

export function isExtensionEvent(event: EventLike | null | undefined): boolean {
  const values = event?.exception?.values
  if (!Array.isArray(values)) return false

  for (const exception of values) {
    const frames = exception?.stacktrace?.frames
    if (Array.isArray(frames)) {
      for (const frame of frames) {
        const filename = frame?.filename
        if (typeof filename === 'string' && EXTENSION_PREFIXES.some(prefix => filename.startsWith(prefix))) {
          return true
        }
      }
    }
  }

  return false
}

export function isExpectedHttpError(hint: EventHint | { originalException?: unknown } | null | undefined): boolean {
  const ex = hint?.originalException
  if (!ex || (typeof ex !== 'object' && typeof ex !== 'function')) return false

  const candidate = ex as {
    statusCode?: unknown
    status?: unknown
    response?: { status?: unknown }
  }

  const code = candidate.statusCode ?? candidate.status ?? candidate.response?.status
  return typeof code === 'number' && EXPECTED_HTTP_STATUSES.has(code)
}

export function buildBeforeSend() {
  return <T extends Event>(event: T, hint?: EventHint): T | null => {
    if (isExtensionEvent(event) || isExpectedHttpError(hint)) {
      return null
    }
    return scrubResetTokens(event)
  }
}
