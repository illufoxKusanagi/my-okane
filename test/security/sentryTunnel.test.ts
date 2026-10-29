import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { H3Event } from 'h3'
import { parseDsn } from '~~/server/routes/tunnel.post'

let mockHeaders: Record<string, string> = {}
let mockRawBody = ''
const mockFetch = vi.fn()
global.fetch = mockFetch as unknown as typeof fetch

vi.mock('~~/server/utils/rateLimiter', () => ({
  checkRateLimit: vi.fn().mockResolvedValue(undefined)
}))

vi.mock('h3', async (importOriginal) => {
  const actual = await importOriginal<typeof import('h3')>()
  return {
    ...actual,
    getHeader: (_event: unknown, name: string) => mockHeaders[name.toLowerCase()],
    readRawBody: async (_event: unknown) => mockRawBody
  }
})

async function loadTunnelHandler(dsn?: string) {
  vi.resetModules()
  if (dsn !== undefined) {
    vi.stubEnv('NUXT_PUBLIC_SENTRY_DSN', dsn)
  } else {
    vi.unstubAllEnvs()
    delete process.env.NUXT_PUBLIC_SENTRY_DSN
  }
  const mod = await import('~~/server/routes/tunnel.post')
  return mod.default
}

describe('sentry tunnel route', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockHeaders = {}
    mockRawBody = ''
  })

  describe('parseDsn', () => {
    it('correctly parses valid Sentry DSN URLs', () => {
      const parsed = parseDsn('https://publickey@o12345.ingest.us.sentry.io/4511668334821376')
      expect(parsed).toEqual({
        host: 'o12345.ingest.us.sentry.io',
        projectId: '4511668334821376'
      })
    })

    it('returns null for missing, empty, or undefined values', () => {
      expect(parseDsn(undefined)).toBeNull()
      expect(parseDsn('')).toBeNull()
    })

    it('returns null for invalid URLs or URLs without a project ID', () => {
      expect(parseDsn('not-a-valid-url')).toBeNull()
      expect(parseDsn('https://sentry.example.com')).toBeNull()
      expect(parseDsn('https://sentry.example.com/')).toBeNull()
    })
  })

  describe('handler execution', () => {
    const dummyEvent = {} as H3Event

    it('returns 503 when DSN is not configured', async () => {
      const handler = await loadTunnelHandler('')
      const res = await (handler as unknown as (e: H3Event) => Promise<Response>)(dummyEvent)
      expect(res.status).toBe(503)
      expect(await res.text()).toBe('Sentry tunnel not configured')
    })

    it('returns 413 when content-length header exceeds 256KB boundary', async () => {
      const handler = await loadTunnelHandler('https://key@allowed.sentry.io/42')
      mockHeaders['content-length'] = String(256 * 1024 + 1)
      const res = await (handler as unknown as (e: H3Event) => Promise<Response>)(dummyEvent)
      expect(res.status).toBe(413)
      expect(await res.text()).toBe('Payload too large')
    })

    it('returns 400 when body is empty', async () => {
      const handler = await loadTunnelHandler('https://key@allowed.sentry.io/42')
      mockRawBody = ''
      const res = await (handler as unknown as (e: H3Event) => Promise<Response>)(dummyEvent)
      expect(res.status).toBe(400)
      expect(await res.text()).toBe('No body')
    })

    it('returns 413 when raw body byte length exceeds 256KB', async () => {
      const handler = await loadTunnelHandler('https://key@allowed.sentry.io/42')
      mockRawBody = 'a'.repeat(256 * 1024 + 10)
      const res = await (handler as unknown as (e: H3Event) => Promise<Response>)(dummyEvent)
      expect(res.status).toBe(413)
      expect(await res.text()).toBe('Payload too large')
    })

    it('returns 403 when envelope header targets foreign host', async () => {
      const handler = await loadTunnelHandler('https://key@allowed.sentry.io/42')
      mockRawBody = `${JSON.stringify({ dsn: 'https://key@attacker.sentry.io/42' })}\n{}`
      const res = await (handler as unknown as (e: H3Event) => Promise<Response>)(dummyEvent)
      expect(res.status).toBe(403)
      expect(await res.text()).toBe('Invalid Sentry host')
    })

    it('returns 403 when envelope header targets foreign project ID', async () => {
      const handler = await loadTunnelHandler('https://key@allowed.sentry.io/42')
      mockRawBody = `${JSON.stringify({ dsn: 'https://key@allowed.sentry.io/9999' })}\n{}`
      const res = await (handler as unknown as (e: H3Event) => Promise<Response>)(dummyEvent)
      expect(res.status).toBe(403)
      expect(await res.text()).toBe('Invalid project ID')
    })

    it('forwards envelope upstream when DSN host and project ID match', async () => {
      const handler = await loadTunnelHandler('https://key@allowed.sentry.io/42')
      mockRawBody = `${JSON.stringify({ dsn: 'https://key@allowed.sentry.io/42' })}\n{"event_id":"123"}`
      mockFetch.mockResolvedValueOnce(new Response(null, { status: 200 }))

      const res = await (handler as unknown as (e: H3Event) => Promise<Response>)(dummyEvent)
      expect(res.status).toBe(200)
      expect(mockFetch).toHaveBeenCalledWith(
        'https://allowed.sentry.io/api/42/envelope/',
        {
          method: 'POST',
          body: mockRawBody,
          headers: { 'Content-Type': 'application/x-sentry-envelope' }
        }
      )
    })
  })
})
