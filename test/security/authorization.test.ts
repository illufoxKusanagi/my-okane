import { describe, it, expect, vi, beforeEach } from 'vitest'
import { getAuthUserId } from '~~/server/utils/auth'
import type { H3Event } from 'h3'

// Mock the requireUserSession helper globally
const mockRequireUserSession = vi.fn()
global.requireUserSession = mockRequireUserSession as unknown as typeof requireUserSession

describe('getAuthUserId Security Authorization Guards', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('should return the userId if user session is valid', async () => {
    const mockEvent = {} as H3Event

    // Stub requireUserSession to return a valid mock user session
    mockRequireUserSession.mockResolvedValue({
      user: { id: 42, name: 'Secure User', email: 'secure@example.com' },
      secure: true
    } as unknown as Awaited<ReturnType<typeof requireUserSession>>)

    const userId = await getAuthUserId(mockEvent)
    expect(userId).toBe(42)
  })

  it('should throw a 401 Unauthorized error if session is missing or invalid', async () => {
    const mockEvent = {} as H3Event

    // Stub requireUserSession to return null or invalid session
    mockRequireUserSession.mockResolvedValue(null as unknown as Awaited<ReturnType<typeof requireUserSession>>)

    try {
      await getAuthUserId(mockEvent)
      expect.fail('Should have thrown unauthorized error')
    } catch (err: unknown) {
      const error = err as { statusCode?: number, message?: string, statusMessage?: string }
      expect(error).toBeDefined()
      expect(error.statusCode).toBe(401)
      const message = error.message || error.statusMessage || ''
      expect(message.toLowerCase()).toContain('unauthorized')
    }
  })
})
