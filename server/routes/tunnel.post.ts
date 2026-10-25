import { defineEventHandler, getHeader, readRawBody } from 'h3'
import { checkRateLimit } from '~~/server/utils/rateLimiter'

const SENTRY_HOST = process.env.SENTRY_HOST || 'o4507028420657152.ingest.us.sentry.io'
const SENTRY_PROJECT_IDS_RAW = process.env.SENTRY_PROJECT_IDS
const KNOWN_PROJECT_IDS: string[] = (() => {
  if (!SENTRY_PROJECT_IDS_RAW) return ['4511668334821376']
  try {
    const parsed = JSON.parse(SENTRY_PROJECT_IDS_RAW)
    return Array.isArray(parsed) ? parsed.map(String) : ['4511668334821376']
  } catch {
    return ['4511668334821376']
  }
})()

const MAX_ENVELOPE_SIZE = 256 * 1024 // 256 KB — generous for Sentry envelopes, prevents OOM

export default defineEventHandler(async (event) => {
  // Rate limit tunnel requests to prevent external reflection spam
  await checkRateLimit(event, {
    uniqueKey: 'sentry_tunnel',
    windowMs: 60 * 1000,
    limit: 60,
    message: 'Too many tunnel requests.'
  })

  // Pre-read size boundary: reject oversized bodies before they touch memory.
  const contentLengthHeader = getHeader(event, 'content-length')
  if (contentLengthHeader) {
    const parsed = Number(contentLengthHeader)
    if (!Number.isNaN(parsed) && parsed > MAX_ENVELOPE_SIZE) {
      return new Response('Payload too large', { status: 413 })
    }
  }

  let body: string
  try {
    const raw = await readRawBody(event)
    body = raw || ''
  } catch {
    return new Response('Failed to read body', { status: 400 })
  }

  if (!body) {
    return new Response('No body', { status: 400 })
  }

  // Post-read byte boundary: content-length can be absent, forged, or wrong.
  // Buffer.byteLength counts actual UTF-8 bytes, not UTF-16 code units.
  if (Buffer.byteLength(body) > MAX_ENVELOPE_SIZE) {
    return new Response('Payload too large', { status: 413 })
  }

  try {
    const lines = body.split('\n')
    const envelopeHeader = lines[0]
    if (!envelopeHeader) {
      return new Response('Invalid envelope', { status: 400 })
    }
    const header = JSON.parse(envelopeHeader)
    const dsn = new URL(header.dsn)
    const projectId = dsn.pathname.replace('/', '')

    if (!KNOWN_PROJECT_IDS.includes(projectId)) {
      return new Response('Invalid project ID', { status: 403 })
    }

    if (dsn.hostname !== SENTRY_HOST) {
      return new Response('Invalid Sentry host', { status: 403 })
    }

    const upstreamUrl = `https://${SENTRY_HOST}/api/${projectId}/envelope/`
    const response = await fetch(upstreamUrl, {
      method: 'POST',
      body,
      headers: { 'Content-Type': 'application/x-sentry-envelope' }
    })

    return new Response(null, { status: response.status })
  } catch (err) {
    console.error('[sentry-tunnel] Error:', err)
    return new Response('Internal error', { status: 500 })
  }
})
