import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { checkRateLimit, resetRateLimits } from "~~/server/utils/rateLimiter";
import { type H3Event } from "h3";

// Mock globals/auto-imports used by Nitro
const mockSetResponseHeader = vi.fn();
const mockCreateError = vi.fn((args) => {
  const err = new Error(args.message || args.statusMessage);
  (err as any).statusCode = args.statusCode;
  return err;
});
const mockGetRequestIP = vi.fn();

// Register mocks on global namespace for Nitro compatibility
global.setResponseHeader = mockSetResponseHeader;
global.createError = mockCreateError;

vi.mock("h3", async (importOriginal) => {
  const original = await importOriginal<typeof import("h3")>();
  return {
    ...original,
    getRequestIP: () => mockGetRequestIP(),
    setResponseHeader: (...args: any[]) => mockSetResponseHeader(...args),
    createError: (args: any) => mockCreateError(args),
  };
});

describe("checkRateLimit utility", () => {
  beforeEach(() => {
    resetRateLimits();
    vi.restoreAllMocks();
    mockSetResponseHeader.mockClear();
    mockCreateError.mockClear();
    mockGetRequestIP.mockClear();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("should allow requests under the limit", () => {
    mockGetRequestIP.mockReturnValue("1.2.3.4");
    const event = {} as H3Event;
    const config = {
      uniqueKey: "test_key",
      windowMs: 1000,
      limit: 2,
      message: "Too many attempts",
    };

    expect(() => checkRateLimit(event, config)).not.toThrow();
    expect(() => checkRateLimit(event, config)).not.toThrow();
  });

  it("should throw a 429 error and set retry-after when limit is exceeded", () => {
    mockGetRequestIP.mockReturnValue("1.2.3.4");
    const event = {} as H3Event;
    const config = {
      uniqueKey: "test_key",
      windowMs: 5000,
      limit: 2,
      message: "Too many attempts",
    };

    // First two requests should pass
    checkRateLimit(event, config);
    checkRateLimit(event, config);

    // Third request should throw
    expect(() => checkRateLimit(event, config)).toThrow();
    expect(mockSetResponseHeader).toHaveBeenCalledWith(event, "retry-after", expect.any(String));
    expect(mockCreateError).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: 429,
        statusMessage: "Too Many Requests",
      })
    );
  });

  it("should separate rate limits for different IPs", () => {
    const event = {} as H3Event;
    const config = {
      uniqueKey: "test_key",
      windowMs: 1000,
      limit: 1,
      message: "Too many attempts",
    };

    // IP 1: Allow 1st request, block 2nd
    mockGetRequestIP.mockReturnValue("1.1.1.1");
    expect(() => checkRateLimit(event, config)).not.toThrow();
    expect(() => checkRateLimit(event, config)).toThrow();

    // IP 2: Should still allow 1st request
    mockGetRequestIP.mockReturnValue("2.2.2.2");
    expect(() => checkRateLimit(event, config)).not.toThrow();
  });

  it("should allow requests again after window expiry", () => {
    mockGetRequestIP.mockReturnValue("1.2.3.4");
    const event = {} as H3Event;
    const config = {
      uniqueKey: "test_key",
      windowMs: 1000,
      limit: 1,
      message: "Too many attempts",
    };

    checkRateLimit(event, config);
    expect(() => checkRateLimit(event, config)).toThrow();

    // Fast-forward time past the windowMs
    vi.setSystemTime(Date.now() + 1001);

    expect(() => checkRateLimit(event, config)).not.toThrow();
  });
});
