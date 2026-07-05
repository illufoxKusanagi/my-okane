import { scryptSync, randomBytes, timingSafeEqual } from "node:crypto";

/**
 * Hashes a password using Node's built-in scrypt algorithm.
 * Returns a string formatted as salt:hash
 */
export function hashUserPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const derivedKey = scryptSync(password, salt, 64);
  return `${salt}:${derivedKey.toString("hex")}`;
}

/**
 * Verifies a password against a hash created by hashUserPassword.
 */
export function verifyUserPassword(
  password: string,
  storedHash: string,
): boolean {
  try {
    const [salt, key] = storedHash.split(":");
    if (!salt || !key) return false;

    const keyBuffer = Buffer.from(key, "hex");
    const derivedKey = scryptSync(password, salt, 64);

    return timingSafeEqual(keyBuffer, derivedKey);
  } catch (error) {
    return false;
  }
}
