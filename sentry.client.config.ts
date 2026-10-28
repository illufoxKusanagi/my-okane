import * as Sentry from '@sentry/nuxt'
import { scrubResetTokens, scrubResetTokenBreadcrumb } from './sentry.scrub'

if (process.env.NODE_ENV !== 'test') {
  Sentry.init({
    // If set up, you can use your runtime config here
    dsn: useRuntimeConfig().public.sentry.dsn,
    // To avoid adblocker, use this
    tunnel: '/tunnel',
    // We recommend adjusting this value in production, or using tracesSampler
    // for finer control
    tracesSampleRate: 1.0,

    // Enable logs to be sent to Sentry
    enableLogs: true,

    dataCollection: {
      userInfo: false,
      httpBodies: []
    },

    // Setting this option to true will print useful information to the console while you're setting up Sentry.
    debug: false,

    // Password-reset tokens must never leak via captured URLs/messages.
    beforeSend(event) {
      return scrubResetTokens(event)
    },
    beforeBreadcrumb(breadcrumb) {
      return scrubResetTokenBreadcrumb(breadcrumb)
    }
  })
}
