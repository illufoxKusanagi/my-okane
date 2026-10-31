import { ref, computed } from 'vue'
import type { Transaction } from '~/composables/useFinance'
import { isDateInPeriod } from '~~/shared/utils/period'

export function usePocketDetailsController(categoryId: string) {
  const { currentPeriod: currentMonth, periodStartDay } = usePeriod()

  const {
    data: budgetData,
    status,
    refresh
  } = useFetch('/api/budgets', {
    query: { month: currentMonth }
  })

  const pending = computed(() => status.value === 'pending')

  const { transactions, addTransaction, deleteTransaction, updateTransaction }
    = useFinance()

  const pocket = computed(() => {
    if (!budgetData.value) return null
    return budgetData.value.pockets.find(p => p.id === categoryId) || null
  })

  const pocketTransactions = computed(() => {
    return transactions.value.filter((t) => {
      if (t.categoryId !== categoryId || t.transferWalletId) return false
      return isDateInPeriod(t.transactionDate, currentMonth.value, periodStartDay.value)
    })
  })

  const pocketNumber = computed(() => {
    const prefix = '5059'
    const mid = categoryId
      .replace(/[^0-9a-zA-Z]/g, '')
      .slice(-4)
      .toUpperCase()
      .padStart(4, '0')
    const suffix = '8711'
    return `${prefix} ${mid} ${suffix}`
  })

  const isBudgetModalOpen = ref(false)
  const isSaving = ref(false)
  const budgetAmount = ref<number | null>(null)

  const isTxModalOpen = ref(false)
  const txName = ref('')
  const txAmount = ref(0)
  const txNotes = ref('')
  const txDate = ref('')
  const editingTx = ref<Transaction | null>(null)

  const isDeleteConfirmOpen = ref(false)
  const txToDelete = ref<Transaction | null>(null)

  const openBudgetModal = () => {
    budgetAmount.value = pocket.value?.budgetAmount || null
    isBudgetModalOpen.value = true
  }

  const handleSaveBudget = async () => {
    if (isSaving.value) return
    isSaving.value = true
    try {
      await $fetch('/api/budgets', {
        method: 'POST',
        body: {
          categoryId,
          amount: budgetAmount.value || 0,
          month: currentMonth.value
        }
      })
      isBudgetModalOpen.value = false
      refresh()
    } catch (error) {
      console.error('Failed to save budget:', error)
    } finally {
      isSaving.value = false
    }
  }

  const handleDeleteBudget = async () => {
    if (!pocket.value?.budgetId || isSaving.value) return
    isSaving.value = true
    try {
      await $fetch(`/api/budgets/${pocket.value.budgetId}`, {
        method: 'DELETE'
      })
      refresh()
    } catch (error) {
      console.error('Failed to delete budget:', error)
    } finally {
      isSaving.value = false
    }
  }

  const openTxModal = (tx?: Transaction) => {
    const { toDateInputValue } = useFormatters()
    if (tx) {
      editingTx.value = tx
      txName.value = tx.name
      txAmount.value = tx.amount
      txNotes.value = tx.notes || ''
      txDate.value = toDateInputValue(tx.transactionDate)
    } else {
      editingTx.value = null
      txName.value = ''
      txAmount.value = 0
      txNotes.value = ''
      txDate.value = toDateInputValue(new Date())
    }
    isTxModalOpen.value = true
  }

  const handleSaveTransaction = async () => {
    if (
      !txName.value.trim()
      || !(txAmount.value > 0)
      || !txDate.value
      || !pocket.value
      || isSaving.value
    ) {
      return
    }

    const type = pocket.value.type === 'income' ? 'income' : 'spending'
    isSaving.value = true
    try {
      if (editingTx.value) {
        await updateTransaction(
          editingTx.value.id,
          txName.value,
          categoryId,
          txAmount.value,
          type,
          txNotes.value,
          txDate.value
        )
      } else {
        await addTransaction(
          txName.value,
          categoryId,
          txAmount.value,
          type,
          txNotes.value,
          txDate.value
        )
      }
      isTxModalOpen.value = false
      refresh()
    } catch (error) {
      console.error('Failed to save transaction:', error)
    } finally {
      isSaving.value = false
    }
  }

  const confirmDeleteTx = (tx: Transaction) => {
    txToDelete.value = tx
    isDeleteConfirmOpen.value = true
  }

  const handleDeleteConfirm = async () => {
    if (!txToDelete.value || isSaving.value) return
    isSaving.value = true
    try {
      await deleteTransaction(txToDelete.value.id)
      refresh()
    } catch (error) {
      console.error('Failed to delete transaction:', error)
    } finally {
      isSaving.value = false
      isDeleteConfirmOpen.value = false
      txToDelete.value = null
    }
  }

  return {
    currentMonth,
    pocket,
    pocketTransactions,
    pocketNumber,
    status,
    pending,
    isSaving,
    isBudgetModalOpen,
    budgetAmount,
    isTxModalOpen,
    txName,
    txAmount,
    txNotes,
    txDate,
    editingTx,
    isDeleteConfirmOpen,
    txToDelete,
    openBudgetModal,
    handleSaveBudget,
    handleDeleteBudget,
    openTxModal,
    handleSaveTransaction,
    confirmDeleteTx,
    handleDeleteConfirm
  }
}
