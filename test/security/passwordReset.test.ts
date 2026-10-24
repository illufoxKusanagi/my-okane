import { describe, it, expect } from 'vitest'
import { createHash } from 'node:crypto'
import {
  RESET_TOKEN_TTL_MS,
  generateResetToken,
  sha256Hex,
  resetTokenExpiresAt,
  isResetTokenExpired,
  buildResetPasswordUrl
} from '~~/server/utils/passwordReset'
import { passwordSchema } from '~~/server/utils/validator'

describe('Password reset token generation', () => {
  it('should produce a 43-char base64url token (256 bits)', () => {
    const token = generateResetToken()
    expect(token).toMatch(/^[A-Za-z0-9_-]{43}$/)
  })

  it('should produce unique tokens across calls', () => {
    const tokens = new Set(Array.from({ length: 100 }, () => generateResetToken()))
    expect(tokens.size).toBe(100)
  })
})

describe('sha256Hex', () => {
  it('should match the known sha256 vector for empty input', () => {
    expect(sha256Hex('')).toBe(
      'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'
    )
  })

  it('should match the known sha256 vector for "abc"', () => {
    expect(sha256Hex('abc')).toBe(
      'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad'
    )
  })

  it('should agree with node:crypto createHash for arbitrary input', () => {
    const input = generateResetToken()
    const expected = createHash('sha256').update(input).digest('hex')
    expect(sha256Hex(input)).toBe(expected)
  })
})

describe('Reset token expiry (10-minute TTL)', () => {
  it('should set expiry ~10 minutes in the future', () => {
    const before = Date.now()
    const expires = resetTokenExpiresAt()
    const delta = expires.getTime() - before
    expect(RESET_TOKEN_TTL_MS).toBe(10 * 60 * 1000)
    expect(delta).toBeLessThanOrEqual(RESET_TOKEN_TTL_MS)
    expect(delta).toBeGreaterThan(RESET_TOKEN_TTL_MS - 50)
  })

  it('should treat null/undefined expiry as expired (fail closed)', () => {
    expect(isResetTokenExpired(null)).toBe(true)
    expect(isResetTokenExpired(undefined)).toBe(true)
  })

  it('should treat a past expiry as expired', () => {
    expect(isResetTokenExpired(new Date(Date.now() - 1000))).toBe(true)
    expect(isResetTokenExpired(new Date(Date.now() - 1000).toISOString())).toBe(
      true
    )
  })

  it('should treat the exact current instant as expired (strict inequality)', () => {
    const now = new Date()
    expect(isResetTokenExpired(now)).toBe(true)
  })

  it('should treat a future expiry as valid', () => {
    expect(isResetTokenExpired(new Date(Date.now() + 60_000))).toBe(false)
  })

  it('should treat malformed expiry values as expired (fail closed)', () => {
    expect(isResetTokenExpired('not-a-date')).toBe(true)
  })
})

describe('buildResetPasswordUrl', () => {
  it('should include the token in both the query string and URL fragment', () => {
    const url = buildResetPasswordUrl('https://myokane.example', 'tok_123')
    expect(url).toBe(
      'https://myokane.example/reset-password?token=tok_123#token=tok_123'
    )
    expect(url).toContain('?token=tok_123')
    expect(url).toContain('#token=tok_123')
  })

  it('should strip trailing slashes from the app URL', () => {
    expect(buildResetPasswordUrl('https://myokane.example///', 't')).toBe(
      'https://myokane.example/reset-password?token=t#token=t'
    )
  })
})

describe('Shared password schema (register + reset)', () => {
  it('should reject passwords shorter than 8 characters', () => {
    expect(passwordSchema.safeParse('short').success).toBe(false)
    expect(passwordSchema.safeParse('1234567').success).toBe(false)
  })

  it('should accept passwords of 8+ characters', () => {
    expect(passwordSchema.safeParse('12345678').success).toBe(true)
    expect(passwordSchema.safeParse('a-much-longer-password').success).toBe(
      true
    )
  })
})
