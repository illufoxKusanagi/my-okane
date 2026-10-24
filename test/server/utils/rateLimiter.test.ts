import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { checkRateLimit, resetRateLimits } from '~~/server/utils/rateLimiter'
import type { H3Event } from 'h3'

const mockSetResponseHeader = vi.fn()
const mockCreateError = vi.fn((args: { message?: string, statusMessage?: string, statusCode?: number }) => {
  const err = new Error(args.message || args.statusMessage)
  Object.assign(err, { statusCode: args.statusCode, statusMessage: args.statusMessage })
  return err
})
const mockGetRequestIP = vi.fn()

global.setResponseHeader = mockSetResponseHeader as unknown as typeof setResponseHeader
global.createError = mockCreateError as unknown as typeof createError

vi.mock('h3', async (importOriginal) => {
  const original = await importOriginal<typeof import('h3')>()
  return {
    ...original,
    getRequestIP: () => mockGetRequestIP(),
    setResponseHeader: (...args: Parameters<typeof setResponseHeader>) => mockSetResponseHeader(...args),
    createError: (args: Parameters<typeof createError>[0]) => mockCreateError(args as { message?: string, statusMessage?: string, statusCode?: number })
  }
})

describe('checkRateLimit utility', () => {
  beforeEach(() => {
    resetRateLimits()
    vi.restoreAllMocks()
    mockSetResponseHeader.mockClear()
    mockCreateError.mockClear()
    mockGetRequestIP.mockClear()
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('should allow requests under the limit', async () => {
    mockGetRequestIP.mockReturnValue('1.2.3.4')
    const event = {} as H3Event
    const config = {
      uniqueKey: 'test_key',
      windowMs: 1000,
      limit: 2,
      message: 'Too many attempts'
    }

    await expect(checkRateLimit(event, config)).resolves.toBeUndefined()
    await expect(checkRateLimit(event, config)).resolves.toBeUndefined()
  })

  it('should throw a 429 error and set retry-after when limit is exceeded', async () => {
    mockGetRequestIP.mockReturnValue('1.2.3.4')
    const event = {} as H3Event
    const config = {
      uniqueKey: 'test_key',
      windowMs: 5000,
      limit: 2,
      message: 'Too many attempts'
    }

    await checkRateLimit(event, config)
    await checkRateLimit(event, config)

    await expect(checkRateLimit(event, config)).rejects.toMatchObject({
      statusCode: 429,
      statusMessage: 'Too Many Requests'
    })
    expect(mockSetResponseHeader).toHaveBeenCalledWith(
      event,
      'retry-after',
      expect.any(Number)
    )
    expect(mockCreateError).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: 429,
        statusMessage: 'Too Many Requests'
      })
    )
  })

  it('should separate rate limits for different IPs', async () => {
    const event = {} as H3Event
    const config = {
      uniqueKey: 'test_key',
      windowMs: 1000,
      limit: 1,
      message: 'Too many attempts'
    }

    mockGetRequestIP.mockReturnValue('1.1.1.1')
    await expect(checkRateLimit(event, config)).resolves.toBeUndefined()
    await expect(checkRateLimit(event, config)).rejects.toThrow()

    mockGetRequestIP.mockReturnValue('2.2.2.2')
    await expect(checkRateLimit(event, config)).resolves.toBeUndefined()
  })

  it('should allow requests again after window expiry', async () => {
    mockGetRequestIP.mockReturnValue('1.2.3.4')
    const event = {} as H3Event
    const config = {
      uniqueKey: 'test_key',
      windowMs: 1000,
      limit: 1,
      message: 'Too many attempts'
    }

    await checkRateLimit(event, config)
    await expect(checkRateLimit(event, config)).rejects.toThrow()

    vi.setSystemTime(Date.now() + 1001)

    await expect(checkRateLimit(event, config)).resolves.toBeUndefined()
  })

  it('should extract cf-connecting-ip on Cloudflare Workers with context', async () => {
    mockGetRequestIP.mockReturnValue(undefined)
    const event1 = {
      context: { cloudflare: {} },
      headers: new Headers({ 'cf-connecting-ip': '203.0.113.10' })
    } as unknown as H3Event
    const event2 = {
      context: { cloudflare: {} },
      headers: new Headers({ 'cf-connecting-ip': '203.0.113.20' })
    } as unknown as H3Event
    const config = {
      uniqueKey: 'cf_test',
      windowMs: 1000,
      limit: 1,
      message: 'Too many attempts'
    }

    await expect(checkRateLimit(event1, config)).resolves.toBeUndefined()
    await expect(checkRateLimit(event1, config)).rejects.toThrow()

    // Different Cloudflare connecting IP should not be blocked
    await expect(checkRateLimit(event2, config)).resolves.toBeUndefined()
  })

  it('should ignore forged cf-connecting-ip header when Cloudflare context is missing', async () => {
    mockGetRequestIP.mockReturnValue('198.51.100.5')
    const forgedEvent = {
      headers: new Headers({ 'cf-connecting-ip': '203.0.113.99' })
    } as unknown as H3Event
    const config = {
      uniqueKey: 'spoof_test',
      windowMs: 1000,
      limit: 1,
      message: 'Too many attempts'
    }

    await expect(checkRateLimit(forgedEvent, config)).resolves.toBeUndefined()
    // Should be tracked by socket IP (198.51.100.5), not spoofed IP
    await expect(checkRateLimit(forgedEvent, config)).rejects.toThrow()
  })
})
