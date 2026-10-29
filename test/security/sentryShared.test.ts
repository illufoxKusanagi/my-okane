import { describe, it, expect } from 'vitest'
import {
  SENTRY_IGNORE_ERRORS,
  isExtensionEvent,
  isExpectedHttpError,
  buildBeforeSend
} from '~~/sentry.shared'

describe('sentry.shared', () => {
  it('defines SENTRY_IGNORE_ERRORS with the expected noise filters', () => {
    expect(SENTRY_IGNORE_ERRORS).toEqual([
      /^AbortError/,
      'Non-Error promise rejection captured',
      /ResizeObserver loop/,
      /Load failed$/,
      /Failed to fetch dynamically imported module/
    ])
  })

  describe('isExtensionEvent', () => {
    it('detects chrome-extension frames', () => {
      const event = {
        exception: {
          values: [
            {
              stacktrace: {
                frames: [
                  { filename: 'https://myokane.ariefsatria.my.id/_nuxt/entry.js' },
                  { filename: 'chrome-extension://abcdefghijklmnop/content.js' }
                ]
              }
            }
          ]
        }
      }
      expect(isExtensionEvent(event)).toBe(true)
    })

    it('detects moz-extension, safari-extension, and safari-web-extension frames', () => {
      for (const prefix of ['moz-extension://', 'safari-extension://', 'safari-web-extension://']) {
        const event = {
          exception: {
            values: [
              {
                stacktrace: {
                  frames: [{ filename: `${prefix}some-extension-id/script.js` }]
                }
              }
            ]
          }
        }
        expect(isExtensionEvent(event)).toBe(true)
      }
    })

    it('returns false for regular application frames or missing stacktrace', () => {
      expect(isExtensionEvent(null)).toBe(false)
      expect(isExtensionEvent({})).toBe(false)
      expect(isExtensionEvent({ exception: { values: [] } })).toBe(false)
      expect(isExtensionEvent({
        exception: {
          values: [
            {
              stacktrace: {
                frames: [{ filename: 'https://myokane.ariefsatria.my.id/app.vue' }]
              }
            }
          ]
        }
      })).toBe(false)
    })
  })

  describe('isExpectedHttpError', () => {
    it('identifies 4xx user flow statuses as expected', () => {
      const expectedCodes = [400, 401, 403, 404, 409, 422, 429]
      for (const code of expectedCodes) {
        expect(isExpectedHttpError({ originalException: { statusCode: code } })).toBe(true)
        expect(isExpectedHttpError({ originalException: { status: code } })).toBe(true)
        expect(isExpectedHttpError({ originalException: { response: { status: code } } })).toBe(true)
      }
    })

    it('returns false for 500, other errors, or missing originalException', () => {
      expect(isExpectedHttpError(null)).toBe(false)
      expect(isExpectedHttpError({})).toBe(false)
      expect(isExpectedHttpError({ originalException: new Error('boom') })).toBe(false)
      expect(isExpectedHttpError({ originalException: { statusCode: 500 } })).toBe(false)
      expect(isExpectedHttpError({ originalException: { status: 503 } })).toBe(false)
    })
  })

  describe('buildBeforeSend', () => {
    const beforeSend = buildBeforeSend()

    it('drops extension events (returns null)', () => {
      const event = {
        exception: {
          values: [{ stacktrace: { frames: [{ filename: 'chrome-extension://xyz/foo.js' }] } }]
        }
      }
      expect(beforeSend(event)).toBeNull()
    })

    it('drops expected HTTP errors (returns null)', () => {
      const event = { message: 'Session expired' }
      const hint = { originalException: { statusCode: 401 } }
      expect(beforeSend(event, hint)).toBeNull()
    })

    it('keeps 500 errors and scrubs reset tokens and Bearer credentials', () => {
      const event = {
        message: 'Database query failed: Bearer secret_jwt_token_123',
        request: {
          url: 'https://example.com/api?token=reset_token_abc',
          query_string: 'token=reset_token_abc&param=1',
          headers: {
            'authorization': 'Bearer secret_access_token_xyz',
            'cookie': 'session=abc; token=reset_token_abc',
            'set-cookie': 'session=xyz',
            'user-agent': 'Mozilla/5.0 with Bearer internal_token'
          }
        }
      }

      const result = beforeSend(event, { originalException: { statusCode: 500 } })
      expect(result).not.toBeNull()
      expect(result?.message).toBe('Database query failed: Bearer [redacted]')
      expect(result?.request?.url).toBe('https://example.com/api?token=[redacted]')
      expect(result?.request?.query_string).toBe('token=[redacted]&param=1')
      const headers = result?.request?.headers as Record<string, string>
      expect(headers.authorization).toBe('[redacted]')
      expect(headers.cookie).toBe('[redacted]')
      expect(headers['set-cookie']).toBe('[redacted]')
      expect(headers['user-agent']).toBe('Mozilla/5.0 with Bearer [redacted]')
    })
  })
})
