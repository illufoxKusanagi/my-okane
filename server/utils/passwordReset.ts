import { randomBytes, createHash } from 'node:crypto'

export const RESET_TOKEN_TTL_MS = 10 * 60 * 1000

/**
 * 256-bit URL-safe token. Generated inside request handlers only —
 * never at module load (Cloudflare Workers global-scope crypto ban).
 */
export function generateResetToken(): string {
  return randomBytes(32).toString('base64url')
}

export function sha256Hex(input: string): string {
  return createHash('sha256').update(input).digest('hex')
}

export function resetTokenExpiresAt(now = Date.now()): Date {
  return new Date(now + RESET_TOKEN_TTL_MS)
}

export function isResetTokenExpired(
  expiresAt: Date | string | number | null | undefined
): boolean {
  if (!expiresAt) return true
  const time
    = expiresAt instanceof Date
      ? expiresAt.getTime()
      : new Date(expiresAt).getTime()
  if (Number.isNaN(time)) return true
  return time <= Date.now()
}

/**
 * The token travels in both the query string and fragment so webmail
 * clients that strip hash fragments preserve the token, while client-side
 * fragment readers remain fully supported.
 */
export function buildResetPasswordUrl(appUrl: string, token: string): string {
  const base = appUrl.replace(/\/+$/, '')
  return `${base}/reset-password?token=${encodeURIComponent(token)}#token=${encodeURIComponent(token)}`
}
