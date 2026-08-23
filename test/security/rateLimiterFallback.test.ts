import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { H3Event } from 'h3'

vi.mock('@upstash/redis', () => ({
  Redis: function RedisMock() {
    throw new Error('Upstash must not be initialized without env vars')
  } as unknown as new (...args: unknown[]) => unknown
}))

const mockGetRequestIP = vi.fn(() => '203.0.113.7')
const mockSetResponseHeader = vi.fn()
vi.mock('h3', async (importOriginal) => {
  const original = await importOriginal<typeof import('h3')>()
  return {
    ...original,
    getRequestIP: () => mockGetRequestIP(),
    setResponseHeader: (...args: unknown[]) => mockSetResponseHeader(...(args as []))
  }
})

describe('Rate limit regression (in-memory fallback)', () => {
  beforeEach(() => {
    vi.resetModules()
    vi.restoreAllMocks()
    mockGetRequestIP.mockReturnValue('203.0.113.7')
  })

  it('checkRateLimit is awaitable and throws a 429 H3Error when exhausted', async () => {
    const { checkRateLimit } = await import('~~/server/utils/rateLimiter')

    const event = {} as H3Event
    const config = { uniqueKey: 'regression', windowMs: 60000, limit: 1, message: 'Slow down' }

    await expect(checkRateLimit(event, config)).resolves.toBeUndefined()
    await expect(checkRateLimit(event, config)).rejects.toMatchObject({
      statusCode: 429,
      statusMessage: 'Too Many Requests'
    })
  })

  it('resetRateLimit clears the bucket so the next request is allowed', async () => {
    const { checkRateLimit, resetRateLimit } = await import('~~/server/utils/rateLimiter')

    const event = {} as H3Event
    const config = { uniqueKey: 'auth_login', windowMs: 60000, limit: 1, message: 'Slow down' }

    await checkRateLimit(event, config)
    await expect(checkRateLimit(event, config)).rejects.toMatchObject({ statusCode: 429 })

    await resetRateLimit(event, 'auth_login')
    await expect(checkRateLimit(event, config)).resolves.toBeUndefined()
  })
})
