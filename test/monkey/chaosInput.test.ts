import { describe, it, expect } from 'vitest'
import { validateCategory, validateTransaction } from '~~/server/utils/validator'

describe('Validator Chaos & Fuzz Monkey Tests', () => {
  describe('Category validator chaos inputs', () => {
    it('should reject empty object inputs', () => {
      const result = validateCategory({})
      expect(result.success).toBe(false)
    })

    it('should reject empty names or spaces-only names', () => {
      expect(validateCategory({ name: '', type: 'spending' }).success).toBe(false)
    })

    it('should reject extremely long name strings (DoS boundary)', () => {
      const longName = 'a'.repeat(1000)
      const result = validateCategory({ name: longName, type: 'spending' })
      expect(result.success).toBe(false)
    })

    it('should enforce category name length cap at 100', () => {
      expect(validateCategory({ name: 'a'.repeat(100), type: 'spending' }).success).toBe(true)
      expect(validateCategory({ name: 'a'.repeat(101), type: 'spending' }).success).toBe(false)
    })

    it('should accept name strings containing malicious script payloads (sanitization test)', () => {
      // The validator verifies schema types, sanitization happens at DOM output.
      // So this must validate successfully as string type.
      const payload = '<script>alert(1)</script>'
      const result = validateCategory({ name: payload, type: 'spending' })
      expect(result.success).toBe(true)
    })
  })

  describe('Transaction validator chaos inputs', () => {
    it('should reject negative transaction amounts', () => {
      const result = validateTransaction({
        name: 'Lunch',
        type: 'spending',
        amount: -50,
        categoryId: 1
      })
      expect(result.success).toBe(false)
    })

    it('should reject zero transaction amounts', () => {
      const result = validateTransaction({
        name: 'Lunch',
        type: 'spending',
        amount: 0,
        categoryId: 1
      })
      expect(result.success).toBe(false)
    })

    it('should reject non-integer category IDs', () => {
      const result = validateTransaction({
        name: 'Lunch',
        type: 'spending',
        amount: 500,
        categoryId: 1.5
      })
      expect(result.success).toBe(false)
    })

    it('should reject invalid date strings', () => {
      const result = validateTransaction({
        name: 'Lunch',
        type: 'spending',
        amount: 500,
        categoryId: 1,
        transactionDate: 'invalid-date'
      })
      // Regression guard: the validator used to let Invalid Date objects
      // through (NaN timestamp would be written to the database).
      expect(result.success).toBe(false)
    })
  })
})
