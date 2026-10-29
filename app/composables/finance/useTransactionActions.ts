import * as Sentry from '@sentry/nuxt'
import type { Transaction } from './types'
import { useFinanceState } from './useFinanceState'

export function useTransactionActions() {
  const { transactions, categories } = useFinanceState()
  const toast = useToast()

  let t = (key: string, values?: Record<string, unknown>) => {
    const fallbackMap: Record<string, string> = {
      'toasts.txAdded': 'Transaction Added',
      'toasts.txAddedDesc': `Successfully added "${values?.name}".`,
      'toasts.txAddFailed': 'Failed to Add Transaction',
      'toasts.txUpdated': 'Transaction Updated',
      'toasts.txUpdatedDesc': `Successfully updated "${values?.name}".`,
      'toasts.txUpdateFailed': 'Failed to Update Transaction',
      'toasts.txDeleted': 'Transaction Deleted',
      'toasts.txDeletedDesc': 'Transaction has been deleted successfully.',
      'toasts.txDeleteFailed': 'Failed to Delete Transaction'
    }
    return fallbackMap[key] ?? key
  }
  try {
    if (typeof useI18n === 'function') {
      t = useI18n().t
    }
  } catch (error) {
    Sentry.captureException(error)
  }

  const addTransaction = async (
    name: string,
    categoryId: string,
    amount: number,
    type: 'income' | 'spending',
    notes?: string | null,
    date?: string | Date,
    walletId?: string | null
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
            transactionDate: date,
            walletId: walletId || undefined
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
          title: t('toasts.txAdded'),
          description: t('toasts.txAddedDesc', { name }),
          color: 'success'
        })
      }
    } catch (error) {
      console.error('Failed to add transaction:', error)
      toast.add({
        title: t('toasts.txAddFailed'),
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
    date?: string | Date,
    walletId?: string | null
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
            transactionDate: date,
            walletId: walletId || undefined
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
          title: t('toasts.txUpdated'),
          description: t('toasts.txUpdatedDesc', { name }),
          color: 'success'
        })
      }
    } catch (error) {
      console.error('Failed to update transaction:', error)
      toast.add({
        title: t('toasts.txUpdateFailed'),
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
          title: t('toasts.txDeleted'),
          description: t('toasts.txDeletedDesc'),
          color: 'success'
        })
      }
    } catch (error) {
      // Rollback local state on network / server failure
      transactions.value = previousTransactions
      console.error('Failed to delete transaction:', error)
      toast.add({
        title: t('toasts.txDeleteFailed'),
        description: describeApiError(error),
        color: 'error'
      })
      throw error
    }
  }

  return { addTransaction, updateTransaction, deleteTransaction }
}
