import { type H3Event, getRequestIP, setResponseHeader, createError } from "h3";

interface RateLimitConfig {
  uniqueKey: string;
  windowMs: number;
  limit: number;
  message: string;
}

const rateLimitMap = new Map<string, number[]>();

if (import.meta.server) {
  setInterval(() => {
    const now = Date.now();
    for (const [key, timestamps] of rateLimitMap.entries()) {
      const youngest = timestamps[timestamps.length - 1];
      if (youngest && youngest < now - 3600000) {
        rateLimitMap.delete(key);
      }
    }
  }, 600000).unref();
}

export function checkRateLimit(event: H3Event, config: RateLimitConfig) {
  const ip = getRequestIP(event, { xForwardedFor: true }) || "127.0.0.1";
  const mapKey = `${ip}:${config.uniqueKey}`;
  const now = Date.now();

  let timestamps = rateLimitMap.get(mapKey) || [];

  const cutoff = now - config.windowMs;
  timestamps = timestamps.filter((t) => t > cutoff);

  if (timestamps.length >= config.limit) {
    const oldestTimestamp = timestamps[0];
    const waitTimeMs = oldestTimestamp
      ? oldestTimestamp + config.windowMs - now
      : config.windowMs;
    const retryAfter = Math.max(1, Math.ceil(waitTimeMs / 1000));

    setResponseHeader(event, "retry-after", retryAfter.toString() as any);

    throw createError({
      statusCode: 429,
      statusMessage: "Too Many Requests",
      message: `${config.message} Please retry in ${retryAfter} seconds.`,
    });
  }

  timestamps.push(now);
  rateLimitMap.set(mapKey, timestamps);
}

export function resetRateLimits() {
  rateLimitMap.clear();
}
