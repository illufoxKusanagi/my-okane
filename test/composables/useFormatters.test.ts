import { describe, it, expect } from 'vitest'
import { useFormatters } from '~~/app/composables/useFormatters'

describe('useFormatters composable', () => {
  const { formatCurrency, formatDate, formatMonthLabel, getProgressColor } = useFormatters()

  describe('formatCurrency', () => {
    it('should format numbers as Indonesian Rupiah (IDR)', () => {
      // Non-breaking spaces and specific character spacing can vary by environment,
      // so we check for currency indicator and containing numbers.
      const formatted = formatCurrency(50000)
      expect(formatted).toContain('Rp')
      expect(formatted).toContain('50.000')
    })

    it('should handle 0 correctly', () => {
      const formatted = formatCurrency(0)
      expect(formatted).toContain('Rp')
      expect(formatted).toContain('0')
    })
  })

  describe('formatDate', () => {
    it('should format string/date into Indonesian long date format', () => {
      const formatted = formatDate('2026-08-03')
      expect(formatted).toContain('Agustus')
      expect(formatted).toContain('2026')
    })

    it('should return empty string for invalid dates', () => {
      expect(formatDate('invalid-date')).toBe('')
    })
  })

  describe('formatMonthLabel', () => {
    it('should format YYYY-MM into English Month Year representation', () => {
      expect(formatMonthLabel('2026-08')).toBe('August 2026')
      expect(formatMonthLabel('2025-12')).toBe('December 2025')
    })
  })

  describe('getProgressColor', () => {
    it('should return neutral if limit is 0 or negative', () => {
      expect(getProgressColor(100, 0)).toBe('neutral')
      expect(getProgressColor(100, -10)).toBe('neutral')
    })

    it('should return success when spent percentage is below 80%', () => {
      expect(getProgressColor(50, 100)).toBe('success')
      expect(getProgressColor(79, 100)).toBe('success')
    })

    it('should return warning when spent percentage is between 80% and 99%', () => {
      expect(getProgressColor(80, 100)).toBe('warning')
      expect(getProgressColor(99, 100)).toBe('warning')
    })

    it('should return error when spent percentage is 100% or above', () => {
      expect(getProgressColor(100, 100)).toBe('error')
      expect(getProgressColor(120, 100)).toBe('error')
    })
  })
})
