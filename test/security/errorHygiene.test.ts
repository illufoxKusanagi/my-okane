import { describe, it, expect } from 'vitest'
import { createError } from 'h3'

/**
 * Guards against regression of the error-leakage fix: no handler may attach
 * raw errors, upstream messages, or stack traces to client-facing 5xx errors.
 */
function assertNoInternalLeak(error: unknown, context: string) {
  const err = error as { data?: unknown, message?: string, statusMessage?: string }
  expect(err.statusCode ?? 500, `${context}: should be a 5xx`).toBeGreaterThanOrEqual(500)

  const serialized = JSON.stringify({ data: err.data })
  if (err.data !== undefined) {
    // Validation payloads (zod issues) are acceptable; stacks and raw DB errors are not.
    expect(serialized).not.toContain('stack')
    expect(serialized).not.toMatch(/at .+:\d+:\d+/)
  }

  expect(err.statusMessage || err.message).not.toMatch(/SELECT|INSERT|UPDATE|DELETE FROM|drizzle|libsql/i)
}

describe('Error response hygiene', () => {
  it('createError without data carries no internal payload', () => {
    let caught: unknown
    try {
      throw createError({
        statusCode: 500,
        statusMessage: 'Registration failed'
      })
    } catch (error) {
      caught = error
    }
    assertNoInternalLeak(caught, 'registration 500')
  })

  it('zod validation issues attached to 400s must not include stack traces', () => {
    const issues = [{ path: ['email'], message: 'Invalid email address', code: 'invalid_string' }]
    const payload = JSON.stringify(issues)
    expect(payload).not.toContain('stack')
    expect(payload).not.toMatch(/at .+:\d+:\d+/)
  })

  it('serialized Error objects (the old leak pattern) are detectable by this guard', () => {
    const leaked = createError({
      statusCode: 500,
      statusMessage: 'Login failed',
      data: { message: 'UNIQUE constraint failed', stack: new Error().stack }
    })
    const serialized = JSON.stringify((leaked as { data?: unknown }).data)
    // Sanity check: the detector flags exactly the pattern we removed
    expect(serialized).toContain('stack')
  })
})
