import { ref, computed } from 'vue'

export function useBudgetsController() {
  const { currentPeriod: currentMonth, prevPeriod: prevMonth, nextPeriod: nextMonth } = usePeriod()

  const {
    data: budgetData,
    status,
    refresh
  } = useFetch('/api/budgets', {
    query: { month: currentMonth }
  })

  const pending = computed(() => status.value === 'pending')

  const { addCategory } = useFinance()

  const isModalOpen = ref(false)
  const isSaving = ref(false)
  const selectedCategoryId = ref<string | null>(null)
  const budgetAmount = ref<number | null>(null)

  const isCreatePocketModalOpen = ref(false)
  const pocketName = ref('')
  const pocketType = ref<'spending' | 'income'>('spending')
  const pocketColor = ref('blue')
  const pocketIcon = ref('i-lucide-folder')
  const pocketBudgetLimit = ref<number | null>(null)

  const openCreatePocketModal = () => {
    pocketName.value = ''
    pocketType.value = 'spending'
    pocketColor.value = 'blue'
    pocketIcon.value = 'i-lucide-folder'
    pocketBudgetLimit.value = null
    isCreatePocketModalOpen.value = true
  }

  const toast = useToast()

  let t = (key: string) => {
    const fallbackMap: Record<string, string> = {
      'toasts.pocketCreateFailed': 'Failed to Create Pocket',
      'toasts.budgetSaveFailed': 'Failed to Save Budget'
    }
    return fallbackMap[key] ?? key
  }
  try {
    if (typeof useI18n === 'function') {
      t = useI18n().t
    }
  } catch {
    // Non-Nuxt / test context fallback
  }

  const handleCreatePocket = async () => {
    if (!pocketName.value.trim() || isSaving.value) return

    isSaving.value = true
    try {
      const newCategory = await addCategory(
        pocketName.value,
        pocketType.value,
        pocketIcon.value,
        pocketColor.value
      )

      if (
        newCategory
        && pocketType.value === 'spending'
        && pocketBudgetLimit.value !== null
        && pocketBudgetLimit.value > 0
      ) {
        await $fetch('/api/budgets', {
          method: 'POST',
          body: {
            categoryId: newCategory.id,
            amount: pocketBudgetLimit.value,
            month: currentMonth.value
          }
        })
      }

      isCreatePocketModalOpen.value = false
      refresh()
    } catch (error) {
      console.error('Failed to create pocket:', error)
      toast.add({
        title: t('toasts.pocketCreateFailed'),
        description: describeApiError(error),
        color: 'error'
      })
    } finally {
      isSaving.value = false
    }
  }

  const openBudgetModal = (categoryId: string | null, currentAmount = 0) => {
    selectedCategoryId.value = categoryId
    budgetAmount.value = currentAmount || null
    isModalOpen.value = true
  }

  const handleSaveBudget = async () => {
    if (isSaving.value) return
    isSaving.value = true
    try {
      await $fetch('/api/budgets', {
        method: 'POST',
        body: {
          categoryId: selectedCategoryId.value,
          amount: budgetAmount.value || 0,
          month: currentMonth.value
        }
      })
      isModalOpen.value = false
      refresh()
    } catch (error) {
      console.error('Failed to save budget:', error)
      toast.add({
        title: t('toasts.budgetSaveFailed'),
        description: describeApiError(error),
        color: 'error'
      })
    } finally {
      isSaving.value = false
    }
  }

  return {
    currentMonth,
    budgetData,
    status,
    pending,
    isSaving,
    isModalOpen,
    selectedCategoryId,
    budgetAmount,
    isCreatePocketModalOpen,
    pocketName,
    pocketType,
    pocketColor,
    pocketIcon,
    pocketBudgetLimit,
    openCreatePocketModal,
    handleCreatePocket,
    prevMonth,
    nextMonth,
    openBudgetModal,
    handleSaveBudget
  }
}
