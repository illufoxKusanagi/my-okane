import { scrypt, randomBytes, timingSafeEqual } from 'node:crypto'
import { promisify } from 'node:util'

const scryptAsync = promisify(scrypt)

/**
 * Hashes a password asynchronously using Node's built-in scrypt algorithm.
 * Offloads compute to Node.js libuv threadpool (non-blocking).
 * Returns a string formatted as salt:hash
 */
export async function hashUserPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString('hex')
  const derivedKey = (await scryptAsync(password, salt, 64)) as Buffer
  return `${salt}:${derivedKey.toString('hex')}`
}

/**
 * Verifies a password against a hash created by hashUserPassword asynchronously.
 * Offloads compute to Node.js libuv threadpool (non-blocking).
 */
export async function verifyUserPassword(
  password: string,
  storedHash: string
): Promise<boolean> {
  try {
    const [salt, key] = storedHash.split(':')
    if (!salt || !key) return false

    const keyBuffer = Buffer.from(key, 'hex')
    const derivedKey = (await scryptAsync(password, salt, 64)) as Buffer

    return timingSafeEqual(keyBuffer, derivedKey)
  } catch {
    return false
  }
}

/**
 * Pre-computed static dummy hash used to neutralize timing attacks
 * during failed login attempts for non-existent user accounts.
 * Static constant eliminates global-scope crypto/RNG execution during Cloudflare Worker cold starts.
 */
export const DUMMY_PASSWORD_HASH
  = 'f1a4e2c8d7b6a5948372615049382716:8e72e45a3b4481324cb5f2070b3d45b75b4273f439821ebceac0487d92a65b3a5a3192389a9e4173ad2d104f3b86e09b621d09e47177e9b4490bcdf0acab3df6'
