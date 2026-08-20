import { describe, it, expect } from 'vitest'
import {
  validateCategory,
  validateTransaction,
  validateUpdateCategory,
  validateUpdateTransaction
} from '~~/server/utils/validator'

describe('Validator utilities', () => {
  describe('Category validation', () => {
    it('should validate a correct category', () => {
      const data = {
        name: 'Food',
        type: 'spending',
        icon: 'i-lucide-utensils',
        color: 'blue'
      }
      const result = validateCategory(data)
      expect(result.success).toBe(true)
    })

    it('should fail validation if name is empty', () => {
      const data = {
        name: '',
        type: 'spending'
      }
      const result = validateCategory(data)
      expect(result.success).toBe(false)
    })

    it('should fail validation if type is invalid', () => {
      const data = {
        name: 'Food',
        type: 'invalid-type'
      }
      const result = validateCategory(data)
      expect(result.success).toBe(false)
    })
  })

  describe('Transaction validation', () => {
    it('should validate a correct transaction', () => {
      const data = {
        name: 'Lunch',
        type: 'spending',
        amount: 25000,
        categoryId: 1,
        notes: 'Indomaret',
        transactionDate: '2026-08-03'
      }
      const result = validateTransaction(data)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.transactionDate).toBeInstanceOf(Date)
      }
    })

    it('should fail validation if amount is zero or negative', () => {
      const data = {
        name: 'Lunch',
        type: 'spending',
        amount: -5,
        categoryId: 1
      }
      const result = validateTransaction(data)
      expect(result.success).toBe(false)
    })

    it('should fail validation if categoryId is missing', () => {
      const data = {
        name: 'Lunch',
        type: 'spending',
        amount: 25000
      }
      const result = validateTransaction(data)
      expect(result.success).toBe(false)
    })
  })

  describe('Update category validation', () => {
    it('should allow partial fields on update', () => {
      const data = {
        color: 'rose'
      }
      const result = validateUpdateCategory(data)
      expect(result.success).toBe(true)
    })
  })

  describe('Update transaction validation', () => {
    it('should allow partial fields on update', () => {
      const data = {
        amount: 50000
      }
      const result = validateUpdateTransaction(data)
      expect(result.success).toBe(true)
    })
  })
})
