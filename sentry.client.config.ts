import * as Sentry from '@sentry/nuxt'
import { scrubResetTokenBreadcrumb } from './sentry.scrub'
import { SENTRY_IGNORE_ERRORS, buildBeforeSend } from './sentry.shared'

if (process.env.NODE_ENV !== 'test') {
  Sentry.init({
    // If set up, you can use your runtime config here
    dsn: useRuntimeConfig().public.sentry.dsn,
    // To avoid adblocker, use this
    tunnel: '/tunnel',
    sampleRate: 1.0,
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.05 : 1.0,
    environment: process.env.NODE_ENV,
    enableLogs: false,
    ignoreErrors: SENTRY_IGNORE_ERRORS,

    dataCollection: {
      userInfo: false,
      httpBodies: []
    },

    // Setting this option to true will print useful information to the console while you're setting up Sentry.
    debug: false,

    beforeSend: buildBeforeSend(),
    beforeBreadcrumb(breadcrumb) {
      return scrubResetTokenBreadcrumb(breadcrumb)
    }
  })
}
