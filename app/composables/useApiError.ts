interface ApiErrorBody {
  statusMessage?: string
  data?: {
    referenceId?: string
  }
}

/**
 * Extracts the user-facing message from an ofetch/h3 error response.
 * Prefers the sanitized `statusMessage` the server intends for display;
 * never surfaces raw upstream messages or stacks.
 */
export function getApiErrorMessage(error: unknown, fallback = 'An unexpected error occurred.'): string {
  const err = error as { data?: ApiErrorBody } | null | undefined
  return err?.data?.statusMessage || fallback
}

/**
 * Extracts the Sentry correlation id returned by the server on 500s,
 * so users can quote it back for support lookups.
 */
export function getApiErrorReference(error: unknown): string | null {
  const err = error as { data?: ApiErrorBody } | null | undefined
  const referenceId = err?.data?.data?.referenceId
  if (!referenceId || typeof referenceId !== 'string') return null
  return referenceId.slice(0, 8)
}

/**
 * One-stop formatter for toasts and inline error text:
 * "Email address is already registered (Ref: 7f3a9c12)"
 */
export function describeApiError(error: unknown, fallback = 'An unexpected error occurred.'): string {
  const message = getApiErrorMessage(error, fallback)
  const reference = getApiErrorReference(error)
  return reference ? `${message} (Ref: ${reference})` : message
}
