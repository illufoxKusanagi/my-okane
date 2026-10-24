import * as Sentry from '@sentry/nuxt'
import type { Transaction } from './types'
import { useFinanceState } from './useFinanceState'

export function useTransactionActions() {
  const { transactions, categories } = useFinanceState()
  const toast = useToast()

  const addTransaction = async (
    name: string,
    categoryId: string,
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
    id: string,
    name: string,
    categoryId: string,
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
        transactions.value = transactions.value.map(t =>
          t.id === id ? enrichedTx : t
        )
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

  const deleteTransaction = async (id: string) => {
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

  return { addTransaction, updateTransaction, deleteTransaction }
}
