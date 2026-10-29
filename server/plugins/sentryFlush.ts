import * as Sentry from '@sentry/nuxt'

function flushOnCloudflare(event: unknown): void {
  try {
    const candidate = event as {
      context?: {
        cloudflare?: {
          context?: {
            waitUntil?: (promise: Promise<unknown>) => void
          }
        }
      }
    }
    const waitUntil = candidate?.context?.cloudflare?.context?.waitUntil
    if (typeof waitUntil === 'function') {
      waitUntil(Sentry.flush(2000))
    }
  } catch {
    // Guard all access with optional chaining and never throw
  }
}

export default defineNitroPlugin((nitroApp) => {
  nitroApp.hooks.hook('error', (_error, { event } = {}) => {
    flushOnCloudflare(event)
  })

  nitroApp.hooks.hook('afterResponse', (eventOrCtx: unknown) => {
    const wrapped = eventOrCtx as { event?: unknown } | undefined
    flushOnCloudflare(wrapped?.event ?? eventOrCtx)
  })
})
