import { checkRateLimit } from "~~/server/utils/rateLimiter";

export default defineEventHandler(async (event) => {
  const path = event.path;

  if (path.startsWith("/api/")) {
    checkRateLimit(event, {
      uniqueKey: "global_api_ddos",
      windowMs: 60000,
      limit: 100,
      message: "DDoS protection: Too many requests.",
    });

    const isPublicRoute =
      path.startsWith("/api/auth/login") ||
      path.startsWith("/api/auth/register") ||
      path.startsWith("/api/auth/logout") ||
      path.startsWith("/api/sentry-example-api") ||
      path.startsWith("/api/_auth/") ||
      path.startsWith("/api/_nuxt_icon/");

    if (!isPublicRoute) {
      await requireUserSession(event);
    }
  }
});
