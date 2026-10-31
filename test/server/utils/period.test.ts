import { describe, it, expect, beforeAll } from 'vitest'
import { migrate } from 'drizzle-orm/libsql/migrator'
import { and, eq, gte, lte, sql } from 'drizzle-orm'
import { db } from '~~/server/db'
import { categories, transactions, users } from '~~/server/db/schema'
import {
  clampPeriodStartDay,
  formatPeriodLabel,
  getPeriodKeyForDate,
  getPeriodRange,
  isDateInPeriod,
  shiftPeriodKey
} from '~~/shared/utils/period'

describe('Period Utilities', () => {
  describe('clampPeriodStartDay', () => {
    it('handles undefined, null, non-numeric, and non-finite values', () => {
      expect(clampPeriodStartDay(undefined)).toBe(1)
      expect(clampPeriodStartDay(null)).toBe(1)
      expect(clampPeriodStartDay(NaN)).toBe(1)
      expect(clampPeriodStartDay(Infinity)).toBe(1)
      expect(clampPeriodStartDay('invalid' as unknown as number)).toBe(1)
    })

    it('clamps values below 1 and above 28', () => {
      expect(clampPeriodStartDay(0)).toBe(1)
      expect(clampPeriodStartDay(-5)).toBe(1)
      expect(clampPeriodStartDay(29)).toBe(28)
      expect(clampPeriodStartDay(100)).toBe(28)
    })

    it('preserves valid days and truncates floats', () => {
      expect(clampPeriodStartDay(1)).toBe(1)
      expect(clampPeriodStartDay(21)).toBe(21)
      expect(clampPeriodStartDay(28)).toBe(28)
      expect(clampPeriodStartDay(15.7)).toBe(15)
    })
  })

  describe('getPeriodKeyForDate', () => {
    it('returns month key for calendar month when startDay = 1', () => {
      expect(getPeriodKeyForDate('2026-10-01T00:00:00.000Z', 1)).toBe('2026-10')
      expect(getPeriodKeyForDate('2026-10-31T00:00:00.000Z', 1)).toBe('2026-10')
    })

    it('correctly maps dates when startDay = 21', () => {
      expect(getPeriodKeyForDate('2026-10-20T00:00:00.000Z', 21)).toBe('2026-09')
      expect(getPeriodKeyForDate('2026-10-21T00:00:00.000Z', 21)).toBe('2026-10')
      expect(getPeriodKeyForDate('2026-11-20T00:00:00.000Z', 21)).toBe('2026-10')
      expect(getPeriodKeyForDate('2026-11-21T00:00:00.000Z', 21)).toBe('2026-11')
    })

    it('handles year rollover when startDay = 21', () => {
      expect(getPeriodKeyForDate('2026-01-10T00:00:00.000Z', 21)).toBe('2025-12')
      expect(getPeriodKeyForDate('2026-01-21T00:00:00.000Z', 21)).toBe('2026-01')
    })

    it('handles invalid date input gracefully', () => {
      const key = getPeriodKeyForDate('invalid-date', 21)
      expect(key).toMatch(/^\d{4}-\d{2}$/)
    })
  })

  describe('getPeriodRange', () => {
    it('computes range for startDay = 1', () => {
      const { start, end } = getPeriodRange('2026-10', 1)
      expect(start.toISOString()).toBe('2026-10-01T00:00:00.000Z')
      expect(end.toISOString()).toBe('2026-10-31T23:59:59.999Z')
    })

    it('computes range for startDay = 21 within same year', () => {
      const { start, end } = getPeriodRange('2026-10', 21)
      expect(start.toISOString()).toBe('2026-10-21T00:00:00.000Z')
      expect(end.toISOString()).toBe('2026-11-20T23:59:59.999Z')
    })

    it('computes range for startDay = 21 across year boundary', () => {
      const { start, end } = getPeriodRange('2026-12', 21)
      expect(start.toISOString()).toBe('2026-12-21T00:00:00.000Z')
      expect(end.toISOString()).toBe('2027-01-20T23:59:59.999Z')
    })

    it('falls back on malformed periodKey', () => {
      const { start, end } = getPeriodRange('invalid-key', 1)
      expect(start).toBeInstanceOf(Date)
      expect(end).toBeInstanceOf(Date)
      expect(end.getTime()).toBeGreaterThan(start.getTime())
    })
  })

  describe('isDateInPeriod', () => {
    it('checks date membership accurately for startDay = 21', () => {
      expect(isDateInPeriod('2026-10-20T23:59:59.000Z', '2026-10', 21)).toBe(false)
      expect(isDateInPeriod('2026-10-21T00:00:00.000Z', '2026-10', 21)).toBe(true)
      expect(isDateInPeriod('2026-11-05T12:00:00.000Z', '2026-10', 21)).toBe(true)
      expect(isDateInPeriod('2026-11-20T23:59:59.999Z', '2026-10', 21)).toBe(true)
      expect(isDateInPeriod('2026-11-21T00:00:00.000Z', '2026-10', 21)).toBe(false)
    })

    it('returns false for invalid date input', () => {
      expect(isDateInPeriod('not-a-date', '2026-10', 1)).toBe(false)
    })
  })

  describe('shiftPeriodKey', () => {
    it('shifts forward and backward correctly', () => {
      expect(shiftPeriodKey('2026-10', 1)).toBe('2026-11')
      expect(shiftPeriodKey('2026-10', -1)).toBe('2026-09')
      expect(shiftPeriodKey('2026-12', 1)).toBe('2027-01')
      expect(shiftPeriodKey('2026-01', -1)).toBe('2025-12')
      expect(shiftPeriodKey('2026-10', 12)).toBe('2027-10')
    })
  })

  describe('formatPeriodLabel', () => {
    it('formats single month label when startDay = 1', () => {
      const labelEn = formatPeriodLabel('2026-10', 1, 'en-US')
      expect(labelEn).toBe('October 2026')
      const labelId = formatPeriodLabel('2026-10', 1, 'id-ID')
      expect(labelId).toMatch(/Oktober 2026/i)
    })

    it('formats spanned label when startDay > 1 within same year', () => {
      const label = formatPeriodLabel('2026-10', 21, 'en-US')
      expect(label).toBe('Oct 21 – Nov 20, 2026')
    })

    it('formats spanned label across year boundary', () => {
      const label = formatPeriodLabel('2026-12', 21, 'en-US')
      expect(label).toBe('Dec 21, 2026 – Jan 20, 2027')
    })
  })

  describe('Database Period Range Query Integration', () => {
    beforeAll(async () => {
      await migrate(db, { migrationsFolder: './server/db/migrations/turso' })
    })

    it('aggregates transactions strictly within period range when startDay = 21', async () => {
      const [testUser] = await db
        .insert(users)
        .values({
          name: 'Period User',
          email: `period-${Date.now()}@example.com`,
          passwordHash: 'dummy-hash',
          periodStartDay: 21
        })
        .returning()
      expect(testUser).toBeDefined()
      if (!testUser) return

      const [category] = await db
        .insert(categories)
        .values({
          name: 'Food',
          type: 'spending',
          userId: testUser.id
        })
        .returning()
      expect(category).toBeDefined()
      if (!category) return

      await db.insert(transactions).values([
        {
          name: 'Before period',
          type: 'spending',
          amount: 100000,
          categoryId: category.id,
          userId: testUser.id,
          transactionDate: new Date('2026-10-15T00:00:00.000Z')
        },
        {
          name: 'Period start boundary',
          type: 'spending',
          amount: 250000,
          categoryId: category.id,
          userId: testUser.id,
          transactionDate: new Date('2026-10-21T00:00:00.000Z')
        },
        {
          name: 'Period end boundary',
          type: 'spending',
          amount: 150000,
          categoryId: category.id,
          userId: testUser.id,
          transactionDate: new Date('2026-11-20T00:00:00.000Z')
        },
        {
          name: 'After period',
          type: 'spending',
          amount: 300000,
          categoryId: category.id,
          userId: testUser.id,
          transactionDate: new Date('2026-11-21T00:00:00.000Z')
        }
      ])

      const { start, end } = getPeriodRange('2026-10', 21)
      const result = await db
        .select({ total: sql<number>`sum(${transactions.amount})` })
        .from(transactions)
        .where(
          and(
            eq(transactions.userId, testUser.id),
            gte(transactions.transactionDate, start),
            lte(transactions.transactionDate, end)
          )
        )

      expect(Number(result[0]?.total || 0)).toBe(400000)
    })
  })
})
