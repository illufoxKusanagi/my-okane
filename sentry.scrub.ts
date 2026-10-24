/**
 * Shared Sentry scrubbing: password-reset tokens must never leave the
 * browser/server via event URLs, messages, query strings, headers, or
 * breadcrumb data. The token travels as `token=` in a URL query or fragment,
 * which Sentry captures in navigation breadcrumbs and requests — scrub it everywhere.
 */
const TOKEN_PARAM = /(^|[?&#])(token=)[^&\s"'<>#]+/gi

function scrubString(value: string): string {
  return value.replace(TOKEN_PARAM, '$1$2[redacted]')
}

function scrubDataRecord(record: Record<string, unknown> | undefined): void {
  if (!record || typeof record !== 'object') return
  for (const [key, val] of Object.entries(record)) {
    if (typeof val === 'string') {
      record[key] = scrubString(val)
    }
  }
}

interface ScrubbableBreadcrumb {
  message?: string
  data?: Record<string, unknown>
}

interface ScrubbableRequest {
  url?: string
  query_string?: unknown
  headers?: unknown
}

interface ScrubbableEvent {
  message?: string
  request?: ScrubbableRequest
  breadcrumbs?: ScrubbableBreadcrumb[]
}

export function scrubResetTokens<T extends ScrubbableEvent>(payload: T): T {
  const req = payload.request
  if (req) {
    if (typeof req.url === 'string') {
      req.url = scrubString(req.url)
    }
    if (typeof req.query_string === 'string') {
      req.query_string = scrubString(req.query_string)
    } else if (Array.isArray(req.query_string)) {
      for (let i = 0; i < req.query_string.length; i++) {
        const item = req.query_string[i]
        if (Array.isArray(item) && typeof item[1] === 'string') {
          item[1] = scrubString(item[1])
        }
      }
    }
    if (req.headers && typeof req.headers === 'object') {
      const headers = req.headers as Record<string, unknown>
      for (const [header, val] of Object.entries(headers)) {
        if (typeof val === 'string') {
          headers[header] = scrubString(val)
        }
      }
    }
  }
  if (typeof payload.message === 'string') {
    payload.message = scrubString(payload.message)
  }
  if (Array.isArray(payload.breadcrumbs)) {
    for (const breadcrumb of payload.breadcrumbs) {
      if (typeof breadcrumb.message === 'string') {
        breadcrumb.message = scrubString(breadcrumb.message)
      }
      scrubDataRecord(breadcrumb.data)
    }
  }
  return payload
}

export function scrubResetTokenBreadcrumb<
  T extends { message?: string, data?: Record<string, unknown> }
>(breadcrumb: T): T {
  if (typeof breadcrumb.message === 'string') {
    breadcrumb.message = scrubString(breadcrumb.message)
  }
  scrubDataRecord(breadcrumb.data)
  return breadcrumb
}
