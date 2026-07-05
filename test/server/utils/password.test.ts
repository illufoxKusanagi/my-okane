import { describe, it, expect } from "vitest";
import { hashUserPassword, verifyUserPassword } from "~~/server/utils/password";

describe("Password utility", () => {
  it("should hash a password and verify it correctly", () => {
    const password = "mySecurePassword123";
    const hash = hashUserPassword(password);
    
    expect(hash).toContain(":");
    expect(verifyUserPassword(password, hash)).toBe(true);
  });

  it("should not verify an incorrect password", () => {
    const password = "mySecurePassword123";
    const wrongPassword = "wrongPassword123";
    const hash = hashUserPassword(password);
    
    expect(verifyUserPassword(wrongPassword, hash)).toBe(false);
  });

  it("should generate different hashes for the same password due to random salt", () => {
    const password = "samePassword123";
    const hash1 = hashUserPassword(password);
    const hash2 = hashUserPassword(password);
    
    expect(hash1).not.toBe(hash2);
    expect(verifyUserPassword(password, hash1)).toBe(true);
    expect(verifyUserPassword(password, hash2)).toBe(true);
  });

  it("should handle invalid stored hash formats gracefully without throwing", () => {
    expect(verifyUserPassword("password", "no-salt-colon")).toBe(false);
    expect(verifyUserPassword("password", "")).toBe(false);
    expect(verifyUserPassword("password", "salt:")).toBe(false);
  });
});
