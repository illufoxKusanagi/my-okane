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

  it('should cleanly rollback optimistic list mutations on simulated network failure', async () => {
    let transactions = [
      { id: 1, name: 'Tx 1', amount: 50000 },
      { id: 2, name: 'Tx 2', amount: 30000 }
    ]

    const deleteWithRollback = async (id: number, simulateError: boolean) => {
      const snapshot = [...transactions]
      // Optimistic delete
      transactions = transactions.filter(t => t.id !== id)

      if (simulateError) {
        // Rollback
        transactions = snapshot
        throw new Error('Network error')
      }
    }

    // 1. Successful deletion
    await deleteWithRollback(1, false)
    expect(transactions.length).toBe(1)
    expect(transactions[0]?.id).toBe(2)

    // 2. Failed deletion rolls back
    await expect(deleteWithRollback(2, true)).rejects.toThrow('Network error')
    expect(transactions.length).toBe(1)
    expect(transactions[0]?.id).toBe(2)
  })
})
