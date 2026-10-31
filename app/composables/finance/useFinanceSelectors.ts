import type { Transaction, CategoryData } from './types'
import { useFinanceState } from './useFinanceState'
import { isDateInPeriod } from '~~/shared/utils/period'

const colors = [
  'hsl(220 70% 50%)',
  'hsl(160 60% 45%)',
  'hsl(30 80% 55%)',
  'hsl(280 65% 55%)',
  'hsl(0 65% 55%)',
  'hsl(45 95% 50%)',
  'hsl(200 80% 50%)',
  'hsl(340 80% 55%)'
]

const chartColorMap: Record<string, string> = {
  blue: 'hsl(217, 91%, 60%)',
  emerald: 'hsl(142, 71%, 45%)',
  amber: 'hsl(38, 92%, 50%)',
  rose: 'hsl(347, 87%, 60%)',
  purple: 'hsl(271, 91%, 65%)',
  pink: 'hsl(328, 86%, 65%)',
  yellow: 'hsl(48, 96%, 53%)',
  cyan: 'hsl(189, 94%, 43%)',
  indigo: 'hsl(239, 84%, 67%)',
  slate: 'hsl(215, 16%, 47%)'
}

function aggregateByCategory(
  allTransactions: Transaction[],
  type: 'income' | 'spending'
): CategoryData[] {
  const categoryMap = new Map<string, { value: number, color: string }>()

  allTransactions
    .filter(t => t.type === type)
    .forEach((t) => {
      const catName = t.categoryName || 'Uncategorized'
      const catColorName = t.categoryColor || 'slate'
      const catColor = (chartColorMap[catColorName]
        || colors[categoryMap.size % colors.length]
        || 'hsl(215, 16%, 47%)') as string
      const existing = categoryMap.get(catName) || {
        value: 0,
        color: catColor
      }
      categoryMap.set(catName, {
        value: existing.value + t.amount,
        color: existing.color
      })
    })

  return Array.from(categoryMap.entries()).map(([label, data]) => ({
    label,
    value: data.value,
    color: data.color
  }))
}

export function useFinanceSelectors() {
  const { transactions } = useFinanceState()

  const getActivePeriodTransactions = (): Transaction[] => {
    let currentPeriod: string | null = null
    let periodStartDay = 1

    try {
      if (typeof usePeriod === 'function') {
        const period = usePeriod()
        currentPeriod = period.currentPeriod.value
        periodStartDay = period.periodStartDay.value
      }
    } catch {
      // Fallback outside Nuxt setup/test context
    }

    return transactions.value.filter((t) => {
      if (t.transferWalletId) return false
      if (!currentPeriod) return true
      return isDateInPeriod(t.transactionDate, currentPeriod, periodStartDay)
    })
  }

  const getSpendingByCategory = (): CategoryData[] =>
    aggregateByCategory(getActivePeriodTransactions(), 'spending')

  const getIncomeByCategory = (): CategoryData[] =>
    aggregateByCategory(getActivePeriodTransactions(), 'income')

  const getTotalSpending = () =>
    getActivePeriodTransactions()
      .filter(t => t.type === 'spending')
      .reduce((sum, t) => sum + t.amount, 0)

  const getTotalIncome = () =>
    getActivePeriodTransactions()
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0)

  const getTransactionsByCategory = (categoryName: string) =>
    getActivePeriodTransactions().filter(t => t.categoryName === categoryName)

  return {
    getActivePeriodTransactions,
    getSpendingByCategory,
    getIncomeByCategory,
    getTotalSpending,
    getTotalIncome,
    getTransactionsByCategory
  }
}
