import * as Sentry from '@sentry/nuxt'

if (process.env.NODE_ENV !== 'test') {
  Sentry.init({
    // If set up, you can use your runtime config here
    dsn: useRuntimeConfig().public.sentry.dsn,
    // To avoid adblocker, use this
    tunnel: '/tunnel',
    // We recommend adjusting this value in production, or using tracesSampler
    // for finer control
    tracesSampleRate: 1.0,

    // This sets the sample rate to be 10%. You may want this to be 100% while
    // in development and sample at a lower rate in production
    replaysSessionSampleRate: 0.1,

    // If the entire session is not sampled, use the below sample rate to sample
    // sessions when an error occurs.
    replaysOnErrorSampleRate: 1.0,

    // Session Replay kept for money-math debugging, with aggressive privacy
    // masking so financial values, names, and inputs never leave the browser.
    integrations: [
      Sentry.replayIntegration({
        maskAllText: true,
        maskAllInputs: true,
        blockAllMedia: true
      })
    ],

    // Enable logs to be sent to Sentry
    enableLogs: true,

    dataCollection: {
      userInfo: false,
      httpBodies: []
    },

    // Setting this option to true will print useful information to the console while you're setting up Sentry.
    debug: false
  })
}
