import { type H3Event, getRequestIP, setResponseHeader, createError, getHeader } from 'h3'
import { Redis } from '@upstash/redis'

interface RateLimitConfig {
  uniqueKey: string
  windowMs: number
  limit: number
  message: string
}

const rateLimitMap = new Map<string, number[]>()

function cleanupExpiredBuckets(now: number): void {
  for (const [key, timestamps] of rateLimitMap.entries()) {
    const youngest = timestamps[timestamps.length - 1]
    if (youngest && youngest < now - 3600000) {
      rateLimitMap.delete(key)
    }
  }
}

let redisClient: Redis | null | undefined

function getRedis(): Redis | null {
  if (redisClient === undefined) {
    const url = process.env.UPSTASH_REDIS_REST_URL
    const token = process.env.UPSTASH_REDIS_REST_TOKEN
    redisClient = url && token ? new Redis({ url, token }) : null
  }
  return redisClient
}

function getClientIp(event: H3Event): string {
  // On Vercel the edge proxy sanitizes x-forwarded-for with the real client IP,
  // so it is trustworthy there. Self-hosted deployments fall back to the socket
  // address so attackers cannot spoof per-IP buckets via a forged header.
  if (process.env.VERCEL === '1') {
    const forwarded = getHeader(event, 'x-forwarded-for')
    if (forwarded) {
      const last = forwarded.split(',').pop()?.trim()
      if (last) return last
    }
  }
  return getRequestIP(event, { xForwardedFor: false }) || '127.0.0.1'
}

export async function checkRateLimit(event: H3Event, config: RateLimitConfig): Promise<void> {
  const redis = getRedis()
  if (redis) {
    try {
      await checkRateLimitRedis(redis, event, config)
      return
    } catch (error: unknown) {
      if (isHttpError(error)) throw error
      console.error('[rate-limit] Redis backend unavailable, failing open:', error)
    }
  }
  checkRateLimitInMemory(event, config)
}

async function checkRateLimitRedis(redis: Redis, event: H3Event, config: RateLimitConfig): Promise<void> {
  const ip = getClientIp(event)
  const key = `ratelimit:${config.uniqueKey}:${ip}`
  const windowSecs = Math.ceil(config.windowMs / 1000)

  // Throws on failure, which the caller converts to fail-open.
  const [count, ttl] = await redis.pipeline().incr(key).ttl(key).exec()

  if (typeof ttl !== 'number' || ttl < 0) {
    await redis.pexpire(key, config.windowMs)
  }

  if (count > config.limit) {
    const retryAfter = Math.max(
      1,
      Math.ceil(typeof ttl === 'number' && ttl > 0 ? ttl : windowSecs)
    )
    setResponseHeader(event, 'retry-after', retryAfter)
    throw createError({
      statusCode: 429,
      statusMessage: 'Too Many Requests',
      message: `${config.message} Please retry in ${retryAfter} seconds.`
    })
  }
}

function checkRateLimitInMemory(event: H3Event, config: RateLimitConfig): void {
  const ip = getRequestIP(event, { xForwardedFor: false }) || '127.0.0.1'
  const mapKey = `${ip}:${config.uniqueKey}`
  const now = Date.now()

  // Evict stale buckets when map grows, avoiding global timers disallowed in serverless / Cloudflare
  if (rateLimitMap.size > 500) {
    cleanupExpiredBuckets(now)
  }

  let timestamps = rateLimitMap.get(mapKey) || []

  const cutoff = now - config.windowMs
  timestamps = timestamps.filter(t => t > cutoff)

  if (timestamps.length >= config.limit) {
    const oldestTimestamp = timestamps[0]
    const waitTimeMs = oldestTimestamp
      ? oldestTimestamp + config.windowMs - now
      : config.windowMs
    const retryAfter = Math.max(1, Math.ceil(waitTimeMs / 1000))

    setResponseHeader(event, 'retry-after', retryAfter)

    throw createError({
      statusCode: 429,
      statusMessage: 'Too Many Requests',
      message: `${config.message} Please retry in ${retryAfter} seconds.`
    })
  }

  timestamps.push(now)
  rateLimitMap.set(mapKey, timestamps)
}

/**
 * Clears the counter for the given bucket, e.g. after a successful login so
 * only *failed* attempts consume the brute-force budget.
 */
export async function resetRateLimit(event: H3Event, uniqueKey: string): Promise<void> {
  const ip = getClientIp(event)

  const redis = getRedis()
  if (redis) {
    try {
      await redis.del(`ratelimit:${uniqueKey}:${ip}`)
    } catch (error) {
      console.error('[rate-limit] Redis reset failed:', error)
    }
  }

  rateLimitMap.delete(`${ip}:${uniqueKey}`)
}

export function resetRateLimits() {
  rateLimitMap.clear()
}

function isHttpError(error: unknown): boolean {
  return (
    typeof error === 'object'
    && error !== null
    && 'statusCode' in error
    && typeof (error as { statusCode?: unknown }).statusCode === 'number'
  )
}
