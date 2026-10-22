/**
 * Shared Sentry scrubbing: password-reset tokens must never leave the
 * browser/server via event URLs, messages, or breadcrumb data. The token
 * travels as `token=` in a URL fragment, which Sentry *does* capture in
 * navigation breadcrumbs — scrub it everywhere it can appear.
 */
const TOKEN_PARAM = /([?&#]token=)[^&\s"'<>#]+/gi

function scrubString(value: string): string {
  return value.replace(TOKEN_PARAM, '$1[redacted]')
}

interface ScrubbableBreadcrumb {
  message?: string
  data?: Record<string, unknown>
}

interface ScrubbableEvent {
  message?: string
  request?: { url?: string }
  breadcrumbs?: ScrubbableBreadcrumb[]
}

export function scrubResetTokens<T extends ScrubbableEvent>(payload: T): T {
  if (payload.request?.url) {
    payload.request.url = scrubString(payload.request.url)
  }
  if (payload.message) {
    payload.message = scrubString(payload.message)
  }
  if (Array.isArray(payload.breadcrumbs)) {
    for (const breadcrumb of payload.breadcrumbs) {
      if (typeof breadcrumb.message === 'string') {
        breadcrumb.message = scrubString(breadcrumb.message)
      }
      const data = breadcrumb.data
      const url = data?.url
      if (data && typeof url === 'string') {
        data.url = scrubString(url)
      }
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
  const data = breadcrumb.data
  const url = data?.url
  if (data && typeof url === 'string') {
    data.url = scrubString(url)
  }
  return breadcrumb
}
