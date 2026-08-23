import { describe, it, expect, vi, beforeEach } from "vitest";
import { getAuthUserId } from "~~/server/utils/auth";
import type { H3Event } from "h3";

// Mock the requireUserSession helper globally
const mockRequireUserSession = vi.fn();
global.requireUserSession = mockRequireUserSession as any;

describe("getAuthUserId Security Authorization Guards", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("should return the userId if user session is valid", async () => {
    const mockEvent = {} as H3Event;
    
    // Stub requireUserSession to return a valid mock user session
    mockRequireUserSession.mockResolvedValue({
      user: { id: 42, name: "Secure User", email: "secure@example.com" },
      secure: true,
    } as any);

    const userId = await getAuthUserId(mockEvent);
    expect(userId).toBe(42);
  });

  it("should throw a 401 Unauthorized error if session is missing or invalid", async () => {
    const mockEvent = {} as H3Event;
    
    // Stub requireUserSession to return null or invalid session
    mockRequireUserSession.mockResolvedValue(null as any);

    try {
      await getAuthUserId(mockEvent);
      expect.fail("Should have thrown unauthorized error");
    } catch (err: any) {
      expect(err).toBeDefined();
      expect(err.statusCode).toBe(401);
      const message = err.message || err.statusMessage || "";
      expect(message.toLowerCase()).toContain("unauthorized");
    }
  });
});
