import { type H3Event, getRequestIP, setResponseHeader, createError, getHeader } from 'h3'
import { Redis } from '@upstash/redis'
import { getEnv } from '~~/server/utils/runtimeEnv'

interface RateLimitConfig {
  uniqueKey: string
  windowMs: number
  limit: number
  message: string
  customKey?: string
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
    let configUrl = ''
    let configToken = ''
    try {
      const config = useRuntimeConfig()
      configUrl = (config.upstashRedisRestUrl as string) || ''
      configToken = (config.upstashRedisRestToken as string) || ''
    } catch {
      // Outside Nuxt context
    }
    const url = configUrl || getEnv('UPSTASH_REDIS_REST_URL') || process.env.UPSTASH_REDIS_REST_URL
    const token = configToken || getEnv('UPSTASH_REDIS_REST_TOKEN') || process.env.UPSTASH_REDIS_REST_TOKEN
    redisClient = url && token ? new Redis({ url, token }) : null
  }
  return redisClient
}

function extractHeader(event: H3Event, name: string): string | undefined {
  try {
    const val = getHeader(event, name)
    if (val) return val
  } catch {
    // Ignore error and try explicit property inspection
  }

  const headerName = name.toLowerCase()
  const ev = event as unknown as {
    headers?: Headers | Record<string, string | string[] | undefined>
    web?: { request?: { headers?: Headers } }
  }

  try {
    if (ev?.web?.request?.headers && typeof ev.web.request.headers.get === 'function') {
      const v = ev.web.request.headers.get(headerName)
      if (v) return v
    }
    if (ev?.headers) {
      if (typeof (ev.headers as Headers).get === 'function') {
        const v = (ev.headers as Headers).get(headerName)
        if (v) return v
      } else if (typeof ev.headers === 'object') {
        const v = (ev.headers as Record<string, string | undefined>)[headerName]
        if (typeof v === 'string') return v
      }
    }
  } catch {
    // Ignore fallback inspection errors
  }
  return undefined
}

function getClientIp(event: H3Event): string {
  try {
    // Cloudflare Workers sets cf-connecting-ip (trusted only when Cloudflare context is present)
    if (event.context?.cloudflare) {
      const cfIp = extractHeader(event, 'cf-connecting-ip')
      if (cfIp) return cfIp.trim()
    }

    // On Vercel the edge proxy sanitizes x-forwarded-for with the real client IP,
    // so it is trustworthy there. Self-hosted deployments fall back to the socket
    // address so attackers cannot spoof per-IP buckets via a forged header.
    if (process.env.VERCEL === '1') {
      const forwarded = extractHeader(event, 'x-forwarded-for')
      if (forwarded) {
        const last = forwarded.split(',').pop()?.trim()
        if (last) return last
      }
    }
  } catch {
    // Fallback if event is mocked or header extraction fails
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
  const key = `ratelimit:${config.uniqueKey}:${config.customKey ?? ip}`
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
  const ip = getClientIp(event)
  const mapKey = `${config.customKey ?? ip}:${config.uniqueKey}`
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
export async function resetRateLimit(event: H3Event, uniqueKey: string, customKey?: string): Promise<void> {
  const ip = getClientIp(event)

  const redis = getRedis()
  if (redis) {
    try {
      await redis.del(`ratelimit:${uniqueKey}:${customKey ?? ip}`)
    } catch (error) {
      console.error('[rate-limit] Redis reset failed:', error)
    }
  }

  rateLimitMap.delete(`${customKey ?? ip}:${uniqueKey}`)
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
