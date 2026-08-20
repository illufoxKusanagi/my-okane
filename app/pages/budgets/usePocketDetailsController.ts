import { ref, computed } from 'vue'
import type { Transaction } from '~/composables/useFinance'

export function usePocketDetailsController(categoryId: number) {
  const currentMonth = ref(new Date().toISOString().slice(0, 7))

  const { data: budgetData, status, refresh } = useFetch('/api/budgets', {
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
      if (t.categoryId !== categoryId) return false

      const tDate = new Date(t.transactionDate)
      const yyyymm = `${tDate.getFullYear()}-${String(tDate.getMonth() + 1).padStart(2, '0')}`
      return yyyymm === currentMonth.value
    })
  })

  const pocketNumber = computed(() => {
    const prefix = '5059'
    const mid = String(categoryId).padStart(4, '0')
    const suffix = '8711'
    return `${prefix} ${mid} ${suffix}`
  })

  const isBudgetModalOpen = ref(false)
  const budgetAmount = ref<number | null>(null)

  const isTxModalOpen = ref(false)
  const txName = ref('')
  const txAmount = ref<number | null>(null)
  const txNotes = ref('')
  const editingTx = ref<Transaction | null>(null)

  const openBudgetModal = () => {
    budgetAmount.value = pocket.value?.budgetAmount || null
    isBudgetModalOpen.value = true
  }

  const handleSaveBudget = async () => {
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
    }
  }

  const handleDeleteBudget = async () => {
    if (!pocket.value?.budgetId) return
    try {
      await $fetch(`/api/budgets/${pocket.value.budgetId}`, {
        method: 'DELETE'
      })
      refresh()
    } catch (error) {
      console.error('Failed to delete budget:', error)
    }
  }

  const openTxModal = (tx?: Transaction) => {
    if (tx) {
      editingTx.value = tx
      txName.value = tx.name
      txAmount.value = tx.amount
      txNotes.value = tx.notes || ''
    } else {
      editingTx.value = null
      txName.value = ''
      txAmount.value = null
      txNotes.value = ''
    }
    isTxModalOpen.value = true
  }

  const handleSaveTransaction = async () => {
    if (!txName.value || !txAmount.value || !pocket.value) return

    const type = pocket.value.type === 'income' ? 'income' : 'spending'
    try {
      if (editingTx.value) {
        await updateTransaction(
          editingTx.value.id,
          txName.value,
          categoryId,
          txAmount.value,
          type,
          txNotes.value
        )
      } else {
        await addTransaction(
          txName.value,
          categoryId,
          txAmount.value,
          type,
          txNotes.value
        )
      }
      isTxModalOpen.value = false
      refresh()
    } catch (error) {
      console.error('Failed to save transaction:', error)
    }
  }

  const handleDeleteTx = async (txId: number) => {
    if (confirm('Are you sure you want to delete this transaction?')) {
      try {
        await deleteTransaction(txId)
        refresh()
      } catch (error) {
        console.error('Failed to delete transaction:', error)
      }
    }
  }

  return {
    currentMonth,
    pocket,
    pocketTransactions,
    pocketNumber,
    status,
    pending,
    isBudgetModalOpen,
    budgetAmount,
    isTxModalOpen,
    txName,
    txAmount,
    txNotes,
    editingTx,
    openBudgetModal,
    handleSaveBudget,
    handleDeleteBudget,
    openTxModal,
    handleSaveTransaction,
    handleDeleteTx
  }
}
