import { describe, it, expect } from 'vitest'
import { useFormatters } from '~~/app/composables/useFormatters'

describe('Budget State Transitions', () => {
  const { getProgressColor } = useFormatters()

  it('should transition from neutral to success to warning to error based on thresholds', () => {
    // 1. Neutral State: limit is configured as 0
    expect(getProgressColor(150, 0)).toBe('neutral')

    // 2. Success State: spent amount is below 80% of limit
    expect(getProgressColor(79, 100)).toBe('success')
    expect(getProgressColor(0, 100)).toBe('success')
    expect(getProgressColor(799, 1000)).toBe('success')

    // 3. Warning State: spent amount is exactly or above 80% but below 100% of limit
    expect(getProgressColor(80, 100)).toBe('warning')
    expect(getProgressColor(99, 100)).toBe('warning')
    expect(getProgressColor(800, 1000)).toBe('warning')

    // 4. Error State: spent amount matches or exceeds 100% of limit
    expect(getProgressColor(100, 100)).toBe('error')
    expect(getProgressColor(101, 100)).toBe('error')
    expect(getProgressColor(1000, 1000)).toBe('error')
    expect(getProgressColor(1500, 1000)).toBe('error')
  })
})
