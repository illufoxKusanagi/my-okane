import { watch, computed } from 'vue'
import * as Sentry from '@sentry/nuxt'

export interface Transaction {
  id: number
  name: string
  type: 'income' | 'spending'
  amount: number
  notes?: string | null
  transactionDate: string | Date
  categoryId: number
  categoryName?: string
  categoryIcon?: string
  categoryColor?: string
  createdAt: string | Date
}

export interface Category {
  id: number
  name: string
  type: 'income' | 'spending'
  icon?: string | null
  color?: string | null
}

export interface CategoryData {
  label: string
  value: number
  color: string
}

export function useFinance() {
  const transactions = useState<Transaction[]>('finance:transactions', () => [])
  const categories = useState<Category[]>('finance:categories', () => [])
  const isInitialized = useState<boolean>('finance:isInitialized', () => false)

  const { user } = useUserSession()
  const toast = useToast()

  const fetchAll = async () => {
    try {
      const [txData, catData] = await Promise.all([
        $fetch<Transaction[]>('/api/transactions'),
        $fetch<Category[]>('/api/categories')
      ])
      transactions.value = txData
      categories.value = catData
      isInitialized.value = true
    } catch (error) {
      console.error('Failed to fetch finance data:', error)
      Sentry.captureException(error)
    }
  }

  const reset = () => {
    transactions.value = []
    categories.value = []
    isInitialized.value = false
  }

  if (!isInitialized.value && import.meta.client && user.value) {
    fetchAll()
  }

  if (import.meta.client) {
    watch(
      user,
      (newUser) => {
        if (newUser) {
          fetchAll()
        } else {
          reset()
        }
      },
      { immediate: true }
    )
  }

  const addTransaction = async (
    name: string,
    categoryId: number,
    amount: number,
    type: 'income' | 'spending',
    notes?: string | null,
    date?: string | Date
  ) => {
    try {
      const res = await $fetch<{ success: boolean, data: Transaction }>(
        '/api/transactions',
        {
          method: 'POST',
          body: {
            name,
            categoryId,
            amount,
            type,
            notes,
            transactionDate: date
          }
        }
      )
      if (res.success && res.data) {
        const cat = categories.value.find(c => c.id === categoryId)
        const enrichedTx: Transaction = {
          ...res.data,
          categoryName: cat?.name,
          categoryIcon: cat?.icon || undefined,
          categoryColor: cat?.color || undefined
        }
        transactions.value = [enrichedTx, ...transactions.value]
        toast.add({
          title: 'Transaction Added',
          description: `Successfully added "${name}".`,
          color: 'success'
        })
      }
    } catch (error) {
      console.error('Failed to add transaction:', error)
      Sentry.captureException(error)
      toast.add({
        title: 'Failed to Add Transaction',
        description: describeApiError(error),
        color: 'error'
      })
      throw error
    }
  }

  const updateTransaction = async (
    id: number,
    name: string,
    categoryId: number,
    amount: number,
    type: 'income' | 'spending',
    notes?: string | null,
    date?: string | Date
  ) => {
    try {
      const res = await $fetch<{ success: boolean, data: Transaction }>(
        `/api/transactions/${id}`,
        {
          method: 'PUT',
          body: {
            name,
            categoryId,
            amount,
            type,
            notes,
            transactionDate: date
          }
        }
      )
      if (res.success && res.data) {
        const cat = categories.value.find(c => c.id === categoryId)
        const enrichedTx: Transaction = {
          ...res.data,
          categoryName: cat?.name,
          categoryIcon: cat?.icon || undefined,
          categoryColor: cat?.color || undefined
        }
        transactions.value = transactions.value.map(t => (t.id === id ? enrichedTx : t))
        toast.add({
          title: 'Transaction Updated',
          description: `Successfully updated "${name}".`,
          color: 'success'
        })
      }
    } catch (error) {
      console.error('Failed to update transaction:', error)
      Sentry.captureException(error)
      toast.add({
        title: 'Failed to Update Transaction',
        description: describeApiError(error),
        color: 'error'
      })
      throw error
    }
  }

  const deleteTransaction = async (id: number) => {
    const previousTransactions = [...transactions.value]
    // Optimistically remove from local state immediately for 0ms perceived latency
    transactions.value = transactions.value.filter(t => t.id !== id)

    try {
      const res = await $fetch<{ success: boolean }>(
        `/api/transactions/${id}`,
        {
          method: 'DELETE'
        }
      )
      if (res.success) {
        toast.add({
          title: 'Transaction Deleted',
          description: 'Transaction has been deleted successfully.',
          color: 'success'
        })
      }
    } catch (error) {
      // Rollback local state on network / server failure
      transactions.value = previousTransactions
      console.error('Failed to delete transaction:', error)
      Sentry.captureException(error)
      toast.add({
        title: 'Failed to Delete Transaction',
        description: describeApiError(error),
        color: 'error'
      })
      throw error
    }
  }

  const addCategory = async (
    name: string,
    type: 'income' | 'spending',
    icon?: string,
    color?: string
  ) => {
    try {
      const res = await $fetch<{ success: boolean, data: Category }>(
        '/api/categories',
        {
          method: 'POST',
          body: { name, type, icon, color }
        }
      )
      if (res.success && res.data) {
        categories.value = [...categories.value, res.data]
        toast.add({
          title: 'Category Added',
          description: `Successfully added "${name}".`,
          color: 'success'
        })
        return res.data
      }
    } catch (error) {
      console.error('Failed to add category:', error)
      Sentry.captureException(error)
      toast.add({
        title: 'Failed to Add Category',
        description: describeApiError(error),
        color: 'error'
      })
      throw error
    }
  }

  const deleteCategory = async (id: number) => {
    const previousCategories = [...categories.value]
    const previousTransactions = [...transactions.value]

    // Optimistically remove category and cascade-remove its transactions locally
    categories.value = categories.value.filter(c => c.id !== id)
    transactions.value = transactions.value.filter(t => t.categoryId !== id)

    try {
      const res = await $fetch<{ success: boolean }>(`/api/categories/${id}`, {
        method: 'DELETE'
      })
      if (res.success) {
        toast.add({
          title: 'Category Deleted',
          description: 'Category has been deleted successfully.',
          color: 'success'
        })
      }
    } catch (error) {
      // Rollback on failure
      categories.value = previousCategories
      transactions.value = previousTransactions
      console.error('Failed to delete category:', error)
      Sentry.captureException(error)
      toast.add({
        title: 'Failed to Delete Category',
        description: describeApiError(error),
        color: 'error'
      })
      throw error
    }
  }

  const updateCategory = async (
    id: number,
    name: string,
    type: 'income' | 'spending',
    icon?: string,
    color?: string
  ) => {
    try {
      const res = await $fetch<{ success: boolean, data: Category }>(`/api/categories/${id}`, {
        method: 'PUT',
        body: { name, type, icon, color }
      })
      if (res.success && res.data) {
        const updatedCat = res.data
        categories.value = categories.value.map(c => (c.id === id ? updatedCat : c))
        transactions.value = transactions.value.map((t) => {
          if (t.categoryId === id) {
            return {
              ...t,
              categoryName: updatedCat.name,
              categoryIcon: updatedCat.icon || undefined,
              categoryColor: updatedCat.color || undefined
            }
          }
          return t
        })
        toast.add({
          title: 'Category Updated',
          description: `Successfully updated "${name}".`,
          color: 'success'
        })
      }
    } catch (error) {
      console.error('Failed to update category:', error)
      Sentry.captureException(error)
      toast.add({
        title: 'Failed to Update Category',
        description: describeApiError(error),
        color: 'error'
      })
      throw error
    }
  }

  const getCategories = (type?: 'income' | 'spending') => {
    if (type === 'income')
      return categories.value.filter(c => c.type === 'income')
    if (type === 'spending')
      return categories.value.filter(c => c.type === 'spending')
    return categories.value
  }

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

  const getSpendingByCategory = (): CategoryData[] => {
    const categoryMap = new Map<string, { value: number, color: string }>()

    transactions.value
      .filter(t => t.type === 'spending')
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

  const getIncomeByCategory = (): CategoryData[] => {
    const categoryMap = new Map<string, { value: number, color: string }>()

    transactions.value
      .filter(t => t.type === 'income')
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

  const getTotalSpending = () =>
    transactions.value
      .filter(t => t.type === 'spending')
      .reduce((sum, t) => sum + t.amount, 0)

  const getTotalIncome = () =>
    transactions.value
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0)

  const getTransactionsByCategory = (categoryName: string) =>
    transactions.value.filter(t => t.categoryName === categoryName)

  const isLoading = computed(() => !isInitialized.value)

  return {
    transactions,
    categories,
    isInitialized,
    isLoading,
    fetchAll,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    addCategory,
    updateCategory,
    deleteCategory,
    getCategories,
    getSpendingByCategory,
    getIncomeByCategory,
    getTotalSpending,
    getTotalIncome,
    getTransactionsByCategory,
    reset
  }
}
