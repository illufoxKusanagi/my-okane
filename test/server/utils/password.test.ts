import { describe, it, expect } from 'vitest'
import { hashUserPassword, verifyUserPassword, DUMMY_PASSWORD_HASH } from '~~/server/utils/password'

describe('Password utility', () => {
  it('should hash a password and verify it correctly', async () => {
    const password = 'mySecurePassword123'
    const hash = await hashUserPassword(password)

    expect(hash).toContain(':')
    expect(await verifyUserPassword(password, hash)).toBe(true)
  })

  it('should not verify an incorrect password', async () => {
    const password = 'mySecurePassword123'
    const wrongPassword = 'wrongPassword123'
    const hash = await hashUserPassword(password)

    expect(await verifyUserPassword(wrongPassword, hash)).toBe(false)
  })

  it('should generate different hashes for the same password due to random salt', async () => {
    const password = 'samePassword123'
    const hash1 = await hashUserPassword(password)
    const hash2 = await hashUserPassword(password)

    expect(hash1).not.toBe(hash2)
    expect(await verifyUserPassword(password, hash1)).toBe(true)
    expect(await verifyUserPassword(password, hash2)).toBe(true)
  })

  it('should handle invalid stored hash formats gracefully without throwing', async () => {
    expect(await verifyUserPassword('password', 'no-salt-colon')).toBe(false)
    expect(await verifyUserPassword('password', '')).toBe(false)
    expect(await verifyUserPassword('password', 'salt:')).toBe(false)
  })

  it('should provide a valid DUMMY_PASSWORD_HASH for timing attack neutralization', async () => {
    expect(DUMMY_PASSWORD_HASH).toBeDefined()
    expect(DUMMY_PASSWORD_HASH).toContain(':')
    expect(await verifyUserPassword('anyAttackerGuess123!', DUMMY_PASSWORD_HASH)).toBe(false)
  })
})
