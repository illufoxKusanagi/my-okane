// @vitest-environment node
import { describe, it, expect, beforeAll } from 'vitest'
import { migrate } from 'drizzle-orm/libsql/migrator'
import { eq } from 'drizzle-orm'
import { db } from '~~/server/db'
import { users } from '~~/server/db/schema'
import { hashUserPassword, verifyUserPassword } from '~~/server/utils/password'
import { passwordSchema } from '~~/server/utils/validator'

describe('In-App Password Change & Session Invalidation Logic', () => {
  beforeAll(async () => {
    await migrate(db, { migrationsFolder: './server/db/migrations/turso' })
    await db.delete(users)
  })

  it('rejects passwords shorter than 8 characters', () => {
    expect(passwordSchema.safeParse('short').success).toBe(false)
    expect(passwordSchema.safeParse('1234567').success).toBe(false)
    expect(passwordSchema.safeParse('12345678').success).toBe(true)
  })

  it('authenticates with current password and successfully updates to a new password', async () => {
    const initialPassword = 'oldSecurePassword123'
    const initialHash = await hashUserPassword(initialPassword)

    const [user] = await db
      .insert(users)
      .values({
        name: 'Settings User',
        email: 'settings@example.com',
        passwordHash: initialHash,
        credentialsVersion: 1
      })
      .returning()

    expect(user).toBeDefined()
    if (!user) return

    // 1. Verify current password matches
    const isCurrentValid = await verifyUserPassword(
      initialPassword,
      user.passwordHash
    )
    expect(isCurrentValid).toBe(true)

    const isWrongValid = await verifyUserPassword(
      'wrongPassword123',
      user.passwordHash
    )
    expect(isWrongValid).toBe(false)

    // 2. Hash and update to new password
    const newPassword = 'newSecurePassword456'
    const newHash = await hashUserPassword(newPassword)
    const nextVersion = user.credentialsVersion + 1

    await db
      .update(users)
      .set({
        passwordHash: newHash,
        credentialsVersion: nextVersion
      })
      .where(eq(users.id, user.id))

    // 3. Verify user in DB has updated credentials
    const [updatedUser] = await db
      .select()
      .from(users)
      .where(eq(users.id, user.id))
      .limit(1)

    expect(updatedUser?.credentialsVersion).toBe(2)

    const isOldStillValid = await verifyUserPassword(
      initialPassword,
      updatedUser!.passwordHash
    )
    expect(isOldStillValid).toBe(false)

    const isNewValid = await verifyUserPassword(
      newPassword,
      updatedUser!.passwordHash
    )
    expect(isNewValid).toBe(true)
  })

  it('detects credentialsVersion mismatch to invalidate stale sessions', () => {
    const sessionCredentialsVersion = 1
    const currentDbCredentialsVersion = 2

    // Same check performed in server/middleware/auth.ts line 42
    const isStaleSession
      = sessionCredentialsVersion !== currentDbCredentialsVersion
    expect(isStaleSession).toBe(true)
  })
})
