import { checkRateLimit } from "~~/server/utils/rateLimiter";

export default defineEventHandler(async (event) => {
  const path = event.path;

  // Only protect API routes
  if (path.startsWith("/api/")) {
    // 1. Apply global DDoS rate limit check (100 requests per minute)
    checkRateLimit(event, {
      uniqueKey: "global_api_ddos",
      windowMs: 60000,
      limit: 100,
      message: "DDoS protection: Too many requests.",
    });

    // List of public API endpoints
    const isPublicRoute =
      path.startsWith("/api/auth/login") ||
      path.startsWith("/api/auth/register") ||
      path.startsWith("/api/auth/logout") ||
      path.startsWith("/api/sentry-example-api") ||
      path.startsWith("/api/_auth/") ||
      path.startsWith("/api/_nuxt_icon/");

    if (!isPublicRoute) {
      // requireUserSession will automatically throw a 401 if the session is invalid or missing
      await requireUserSession(event);
    }
  }
});
