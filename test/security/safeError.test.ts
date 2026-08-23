import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createError } from 'h3'
import {
  classifyServerError,
  throwSafeServerError,
  TRANSIENT_ERROR_MESSAGE,
  DEFAULT_CONFLICT_MESSAGE
} from '~~/server/utils/safeError'

const mockCaptureException = vi.fn(() => 'a1b2c3d4e5f67890a1b2c3d4e5f67890')

vi.mock('@sentry/nuxt', () => ({
  captureException: (...args: unknown[]) => mockCaptureException(...(args as []))
}))

describe('classifyServerError', () => {
  it('classifies unique-constraint violations as conflicts (case-insensitive)', () => {
    expect(classifyServerError(new Error('UNIQUE constraint failed: users.email'))).toEqual({
      kind: 'conflict'
    })
    expect(classifyServerError(new Error('SQLite error: SQLITE_CONSTRAINT on index'))).toEqual({
      kind: 'conflict'
    })
    expect(classifyServerError(new Error('Duplicate entry \'x@y.z\' for key'))).toEqual({
      kind: 'conflict'
    })
  })

  it('classifies transient infrastructure errors as unavailable', () => {
    expect(classifyServerError(new Error('SQLITE_BUSY: database is locked'))).toEqual({
      kind: 'unavailable'
    })
    expect(classifyServerError(new Error('fetch failed'))).toEqual({ kind: 'unavailable' })
    expect(
      classifyServerError(new Error('connect ECONNREFUSED 127.0.0.1:8080'))
    ).toEqual({ kind: 'unavailable' })
  })

  it('returns null for unknown errors and non-Error garbage', () => {
    expect(classifyServerError(new Error('something completely different'))).toBeNull()
    expect(classifyServerError(undefined)).toBeNull()
    expect(classifyServerError(null)).toBeNull()
    expect(classifyServerError({ random: 'object' })).toBeNull()
    expect(classifyServerError(42)).toBeNull()
  })

  it('never misclassifies hostile strings designed to look like other kinds', () => {
    // A message containing both patterns resolves to conflict (checked first) — deterministic
    const mixed = new Error('UNIQUE constraint failed after database is locked')
    expect(classifyServerError(mixed)).toEqual({ kind: 'conflict' })
  })
})

describe('throwSafeServerError', () => {
  beforeEach(() => {
    mockCaptureException.mockClear()
    mockCaptureException.mockReturnValue('a1b2c3d4e5f67890a1b2c3d4e5f67890')
  })

  function expectSafe500(fn: () => unknown) {
    let caught: unknown
    try {
      fn()
      expect.fail('expected throw')
    } catch (error) {
      caught = error
    }
    const err = caught as { statusCode?: number, statusMessage?: string, data?: unknown }
    expect(err.statusCode).toBe(500)

    // The critical guard: no internals may leak through any field
    const serialized = JSON.stringify({ statusMessage: err.statusMessage, data: err.data })
    expect(serialized).not.toContain('"stack"')
    expect(serialized).not.toMatch(/at .+:\d+:\d+/)
    expect(serialized).not.toMatch(/UNIQUE constraint|SQLITE_|ECONNREFUSED|SELECT |drizzle/i)
    return err
  }

  it('rethrows existing H3 errors untouched', () => {
    const original = createError({ statusCode: 409, statusMessage: 'Email address is already registered' })
    try {
      throwSafeServerError(original, { context: 'test', fallbackMessage: 'Failed' })
      expect.fail('expected rethrow')
    } catch (error) {
      expect(error).toBe(original)
    }
    expect(mockCaptureException).not.toHaveBeenCalled()
  })

  it('sanitizes unknown errors and includes the Sentry reference id', () => {
    const hostile = new Error('UNIQUE constraint failed: users.email')
    hostile.stack = 'Error: x\n    at /var/task/secret/server/file.ts:12:34'

    const err = expectSafe500(() =>
      throwSafeServerError(hostile, {
        context: 'registration',
        fallbackMessage: 'Registration failed',
        conflictMessage: 'Email address is already registered'
      })
    )
    expect(err.statusMessage).toBe('Email address is already registered')
    expect((err.data as { referenceId?: string }).referenceId).toBe('a1b2c3d4e5f67890a1b2c3d4e5f67890')
    expect(mockCaptureException).toHaveBeenCalledWith(
      hostile,
      expect.objectContaining({ tags: { error_context: 'registration' } })
    )
  })

  it('maps transient failures to the availability message', () => {
    const err = expectSafe500(() =>
      throwSafeServerError(new Error('database is locked'), {
        context: 'fetch transactions',
        fallbackMessage: 'Failed to fetch transactions'
      })
    )
    expect(err.statusMessage).toBe(TRANSIENT_ERROR_MESSAGE)
  })

  it('uses the fallback message for unclassifiable errors', () => {
    const err = expectSafe500(() =>
      throwSafeServerError(new Error('weird internal detail'), {
        context: 'update transaction',
        fallbackMessage: 'Failed to update transaction'
      })
    )
    expect(err.statusMessage).toBe('Failed to update transaction')
    expect(err.statusMessage).not.toBe(DEFAULT_CONFLICT_MESSAGE)
  })

  it('handles non-Error garbage without crashing or leaking properties', () => {
    const err = expectSafe500(() =>
      throwSafeServerError({ evilProperty: 'UNIQUE constraint failed: secret.table' }, {
        context: 'test',
        fallbackMessage: 'Operation failed'
      })
    )
    // Non-Error values stringify to '[object Object]', which matches no pattern
    expect(err.statusMessage).toBe('Operation failed')
  })
})
