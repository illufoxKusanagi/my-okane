import * as Sentry from "@sentry/nuxt";
import { scrubResetTokenBreadcrumb } from "./sentry.scrub";
import { SENTRY_IGNORE_ERRORS, buildBeforeSend } from "./sentry.shared";

if (process.env.NODE_ENV !== "test") {
  Sentry.init({
    dsn: process.env.NUXT_PUBLIC_SENTRY_DSN,
    sampleRate: 1.0,
    tracesSampleRate: process.env.NODE_ENV === "production" ? 0.05 : 1.0,
    environment: process.env.NODE_ENV,
    enableLogs: false,
    ignoreErrors: SENTRY_IGNORE_ERRORS,

    dataCollection: {
      userInfo: false,
      cookies: false,
      httpHeaders: false,
      httpBodies: [],
    },

    beforeSend: buildBeforeSend(),
    beforeBreadcrumb(breadcrumb) {
      return scrubResetTokenBreadcrumb(breadcrumb);
    },

    // Setting this option to true will print useful information to the console while you're setting up Sentry.
    debug: false,
  });
}
