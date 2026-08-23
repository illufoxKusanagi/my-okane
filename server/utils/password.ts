import { scrypt, randomBytes, timingSafeEqual, scryptSync } from 'node:crypto'
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
 * Pre-computed dummy hash used to neutralize timing attacks
 * during failed login attempts for non-existent user accounts.
 * Initialized once on boot so it is immediately available.
 */
export const DUMMY_PASSWORD_HASH: string = (() => {
  const salt = randomBytes(16).toString('hex')
  const derivedKey = scryptSync('my-okane-dummy-constant-for-timing-mitigation-safe', salt, 64)
  return `${salt}:${derivedKey.toString('hex')}`
})()
