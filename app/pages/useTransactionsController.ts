import { ref, computed, watch, onMounted } from 'vue'
import type { Transaction } from '~/composables/useFinance'
import { useReceiptScan } from '~/composables/useReceiptScan'
import { useTransactionsFilter } from './useTransactionsFilter'
import * as Sentry from '@sentry/nuxt'

export function useTransactionsController() {
  const {
    transactions,
    categories,
    isLoading,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    getCategories
  } = useFinance()

  const { isScanning, scanError, scan } = useReceiptScan()
  const fileInput = ref<HTMLInputElement | null>(null)
  const toast = useToast()
  const { formatCurrency, toDateInputValue } = useFormatters()

  const isMobile = ref(false)
  onMounted(() => {
    isMobile.value = /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent)
  })

  const triggerFileSelect = () => {
    fileInput.value?.click()
  }

  const onFileSelected = async (event: Event) => {
    const target = event.target as HTMLInputElement
    const file = target.files?.[0]
    if (!file) return

    try {
      const result = await scan(file)
      if (result) {
        editingTransaction.value = null
        txName.value
          = result.suggestedTransactionName || result.storeName || 'Receipt Scan'
        txAmount.value = result.totalAmount || 0
        txType.value = 'spending'
        txDate.value = result.transactionDate || toDateInputValue(new Date())
        txNotes.value
          = `Scanned from receipt at ${result.storeName || 'Unknown Merchant'}.\n\nItems:\n`
            + result.items
              .map(item => `- ${item.name}: ${formatCurrency(item.price)}`)
              .join('\n')

        const matchedCat = categories.value.find(
          c =>
            c.name.toLowerCase() === result.suggestedCategory.toLowerCase()
            && c.type === 'spending'
        )
        if (matchedCat) {
          txCategoryId.value = matchedCat.id
        } else {
          const cats = getCategories('spending')
          txCategoryId.value = cats.length > 0 ? cats[0]?.id : undefined
        }
        isModalOpen.value = true
      }
    } catch (err: unknown) {
      toast.add({
        title: 'Receipt Scan Failed',
        description: describeApiError(err, 'Failed to scan receipt.'),
        color: 'error'
      })
      Sentry.captureException(err)
    } finally {
      if (fileInput.value) {
        fileInput.value.value = ''
      }
    }
  }

  const {
    searchQuery,
    selectedType,
    selectedCategoryId,
    currentPage,
    pageSize,
    hasActiveFilters,
    resetFilters,
    filteredTransactions,
    paginatedTransactions
  } = useTransactionsFilter(transactions)

  const isModalOpen = ref(false)
  const editingTransaction = ref<Transaction | null>(null)

  const txName = ref('')
  const txType = ref<'income' | 'spending'>('spending')
  const txAmount = ref(0)
  const txCategoryId = ref<string | undefined>(undefined)
  const txNotes = ref('')
  const txDate = ref(toDateInputValue(new Date()))

  const isDeleteConfirmOpen = ref(false)
  const transactionToDelete = ref<Transaction | null>(null)

  const formCategories = computed(() => {
    return getCategories(txType.value)
  })

  watch(txType, (newType) => {
    const cats = getCategories(newType)
    if (txCategoryId.value && cats.some(c => c.id === txCategoryId.value)) {
      return
    }
    txCategoryId.value = cats.length > 0 ? cats[0]?.id : undefined
  })

  const openAddModal = () => {
    editingTransaction.value = null
    txName.value = ''
    txType.value = 'spending'
    txAmount.value = 0
    txNotes.value = ''
    txDate.value = toDateInputValue(new Date())
    const cats = getCategories('spending')
    txCategoryId.value = cats.length > 0 ? cats[0]?.id : undefined
    isModalOpen.value = true
  }

  const handleSaveTransaction = async () => {
    if (
      !txName.value.trim()
      || !txCategoryId.value
      || !(txAmount.value > 0)
      || !txDate.value
    ) {
      return
    }

    try {
      if (editingTransaction.value) {
        await updateTransaction(
          editingTransaction.value.id,
          txName.value,
          txCategoryId.value,
          txAmount.value,
          txType.value,
          txNotes.value,
          txDate.value
        )
      } else {
        await addTransaction(
          txName.value,
          txCategoryId.value,
          txAmount.value,
          txType.value,
          txNotes.value,
          txDate.value
        )
      }
      isModalOpen.value = false
    } catch (error) {
      console.error('Failed to save transaction:', error)
      Sentry.captureException(error)
    }
  }

  const openEditModal = (t: Transaction) => {
    editingTransaction.value = t
    txName.value = t.name
    txType.value = t.type
    txAmount.value = t.amount
    txCategoryId.value = t.categoryId
    txNotes.value = t.notes || ''
    txDate.value = toDateInputValue(t.transactionDate)
    isModalOpen.value = true
  }

  const confirmDeleteTransaction = (t: Transaction) => {
    transactionToDelete.value = t
    isDeleteConfirmOpen.value = true
  }

  const handleDeleteConfirm = async () => {
    if (transactionToDelete.value) {
      await deleteTransaction(transactionToDelete.value.id)
      isDeleteConfirmOpen.value = false
      transactionToDelete.value = null
    }
  }

  return {
    categories,
    isLoading,
    isScanning,
    scanError,
    fileInput,
    isMobile,
    triggerFileSelect,
    onFileSelected,
    searchQuery,
    selectedType,
    selectedCategoryId,
    isModalOpen,
    editingTransaction,
    txName,
    txType,
    txAmount,
    txCategoryId,
    txNotes,
    txDate,
    isDeleteConfirmOpen,
    transactionToDelete,
    formCategories,
    filteredTransactions,
    paginatedTransactions,
    currentPage,
    pageSize,
    hasActiveFilters,
    resetFilters,
    openAddModal,
    handleSaveTransaction,
    openEditModal,
    confirmDeleteTransaction,
    handleDeleteConfirm
  }
}
